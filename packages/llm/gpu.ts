import '@mlc-ai/web-llm';
import type { InitProgressReport } from '@mlc-ai/web-llm';
import { ChatWorkerClient } from '@mlc-ai/web-llm';

import type {
    Action,
    GenerationCallback,
    LlmManager,
    LlmModel,
    MonitorDownloadCallback,
    RunningAction,
    WriteFullEmailAction,
} from '@proton/llm/index';

import mlcConfig from './mlc-config';

async function delay(time: number) {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    await delay(time);
}

export class GpuWriteFullEmailRunningAction implements RunningAction {
    static INSTRUCTIONS = [
        'You write email messages according to the description provided by the user.',
        'You do not use emojis.',
        'There should be no subject, directly write the body of the message.',
        'The signature at the end should stop after the closing salutation.',
    ].join(' ');

    private chat: ChatWorkerClient;

    private action_: WriteFullEmailAction;

    private running: boolean;

    private done: boolean;

    private cancelled: boolean;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(action: WriteFullEmailAction, chat: ChatWorkerClient, callback: GenerationCallback) {
        const userPrompt = action.prompt
            .trim()
            .replaceAll(/(<\|[^>]*\|>)/g, '') // remove <|...|> markers
            .replaceAll(/(<\||\|>)/g, ''); // remove <| and |>
        const prompt = [
            '<|instructions|>\n',
            GpuWriteFullEmailRunningAction.INSTRUCTIONS,
            '\n\n',
            '<|user|>\n',
            userPrompt,
            '\n\n',
            '<|assistant|>\n',
            'Body:\n\n',
        ].join('');

        let fulltext = '';
        const generateProgressCallback = (_step: number, message: string) => {
            const token = message.slice(fulltext.length);
            fulltext = message;
            callback(token, fulltext);
        };
        void chat
            .generate(prompt, generateProgressCallback)
            .then(() => {
                this.done = true;
            })
            .finally(() => {
                this.running = false;
            });
        this.chat = chat;
        this.running = true;
        this.done = false;
        this.cancelled = false;
        this.action_ = action;
    }

    isRunning(): boolean {
        return this.running;
    }

    isDone(): boolean {
        return this.done;
    }

    isCancelled(): boolean {
        return this.cancelled;
    }

    action(): Action {
        return this.action_;
    }

    cancel(): boolean {
        if (this.running) {
            this.chat.interruptGenerate();
            this.running = false;
            this.done = false;
            this.cancelled = true;
            return true;
        }
        return false;
    }
}

export class GpuLlmModel implements LlmModel {
    private chat: ChatWorkerClient;

    private manager: GpuLlmManager;

    constructor(chat: ChatWorkerClient, manager: GpuLlmManager) {
        this.chat = chat;
        this.manager = manager;
    }

    async unload(): Promise<void> {
        await this.chat.unload();
        this.manager.unload();
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async performAction(action: Action, callback: GenerationCallback): Promise<RunningAction> {
        switch (action.type) {
            case 'writeFullEmail':
                return new GpuWriteFullEmailRunningAction(action, this.chat, callback);
            default:
                throw Error('unimplemented');
        }
    }
}

// @ts-ignore
export class GpuLlmManager implements LlmManager {
    private chat: ChatWorkerClient | undefined;

    private status: undefined | 'downloading' | 'loading' | 'loaded' | 'unloaded' | 'error';

    private model: GpuLlmModel | undefined; // defined iff status === 'loaded'

    constructor() {
        this.chat = undefined;
        this.status = undefined;
    }

    hasGpu(): boolean {
        throw Error('todo');
    }

    isDownloading(): boolean {
        return this.status === 'downloading';
    }

    async startDownload(callback: MonitorDownloadCallback): Promise<void> {
        await this.mlcDownloadAndLoadToGpu(callback);
    }

    private async mlcDownloadAndLoadToGpu(callback?: (progress: number, done: boolean) => void) {
        if (!this.chat) {
            let worker = new Worker(new URL('./worker', import.meta.url), { type: 'module' });
            this.chat = new ChatWorkerClient(worker);
        }

        // The "selfhost" variant below would download the weights from our assets dir (see public/assets/ml-models)
        // let variant = 'Mistral-7B-Instruct-v0.2-q4f16_1-selfhost';
        let variant = 'Mistral-7B-Instruct-v0.2-q4f16_1';

        this.chat.setInitProgressCallback((report: InitProgressReport) => {
            const done = report.progress === 1;
            if (report.progress == 1) {
                this.status = 'loading';
            }
            if (callback) {
                void callback(report.progress, done);
            }
        });

        const chatOpts = {};

        this.status = 'downloading';
        try {
            await this.chat.reload(variant, chatOpts, mlcConfig);
            this.model = new GpuLlmModel(this.chat, this);
            this.status = 'loaded';
        } catch (e) {
            this.status = 'error';
            throw e;
        }
    }

    cancelDownload(): boolean {
        throw Error('todo');
    }

    async loadOnGpu(): Promise<LlmModel> {
        if (this.status === undefined) {
            throw Error('model is not downloaded, run startDownload() first');
        }
        if (this.status === 'downloading') {
            throw Error('model is downloading, try again after download is complete');
        }
        if (this.status === 'unloaded') {
            // MLC will skip the download and go straight to loading on GPU
            await this.mlcDownloadAndLoadToGpu();
            // @ts-ignore: TS does not see that the line above will modify `this.status`
            if (this.status !== 'loaded') {
                throw Error('error while waiting for model to load on GPU');
            }
        }
        if (this.status === 'loading') {
            // wait for the model to be loaded
            while (true) {
                await delay(500);
                if (this.status !== 'loading') {
                    break;
                }
            }
            if (this.status !== 'loaded') {
                throw Error('error while waiting for model to load on GPU');
            }
        }
        if (this.status === 'loaded') {
            return this.model!;
        }
        throw Error('error while loading the model on GPU');
    }

    unload() {
        this.status = 'unloaded';
        this.model = undefined;
    }
}
