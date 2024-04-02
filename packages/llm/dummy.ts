import type {
    Action,
    GenerationCallback,
    LlmManager,
    LlmModel,
    MonitorDownloadCallback,
    RunningAction,
    WriteFullEmailAction,
} from '@proton/llm/index';

async function delay(time: number) {
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    await delay(time);
}

function getRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export class DummyWriteFullEmailAction {
    private running: boolean;

    private done: boolean;

    private cancelled: boolean;

    private action_: WriteFullEmailAction;

    constructor(action: WriteFullEmailAction, callback: GenerationCallback) {
        this.running = true;
        this.done = false;
        this.cancelled = false;
        this.action_ = action;
        void this.startGeneration(action, callback);
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
        if (!this.running) {
            return false;
        }
        this.running = false;
        this.cancelled = true;
        return true;
    }

    private async startGeneration(action: WriteFullEmailAction, callback: GenerationCallback) {
        this.running = true;
        const words = this.generateRandomSentence();
        let fulltext = '';
        await delay(5000);
        for (let i = 0; i < words.length && this.running; i++) {
            await delay(150);
            let word = words[i] + ' ';
            fulltext += word;
            callback(word, fulltext);
        }
        this.running = false;
    }

    private generateRandomSentence(): string[] {
        const wordCount = getRandomNumber(50, 200);
        const words = [];

        for (let i = 0; i < wordCount; i++) {
            const word = this.generateRandomWord();
            words.push(word);
        }

        return words;
    }

    private generateRandomWord(): string {
        const length = getRandomNumber(3, 10);
        return Array.from({ length }, () => this.getRandomLetter()).join('');
    }

    private getRandomLetter(): string {
        return String.fromCharCode(Math.floor(Math.random() * 26) + 97);
    }
}

export class DummyLlmModel implements LlmModel {
    async unload(): Promise<void> {
        await delay(1500);
    }

    async performAction(action: Action, callback: GenerationCallback): Promise<RunningAction> {
        switch (action.type) {
            case 'writeFullEmail':
                const run = new DummyWriteFullEmailAction(action, callback);
                return run;
            default:
                throw Error('unimplemented');
        }
    }
}

// @ts-ignore
export class DummyLlmManager implements LlmManager {
    private TOTAL_CHUNKS = 50;

    private downloadedChunks: number;

    private downloading: boolean;

    constructor() {
        this.downloading = false;
        this.downloadedChunks = 0;
    }

    hasGpu(): boolean {
        return true;
    }

    isDownloading(): boolean {
        return this.downloading;
    }

    async startDownload(callback: MonitorDownloadCallback): Promise<void> {
        void (async () => {
            this.downloading = this.downloadedChunks < this.TOTAL_CHUNKS;
            while (this.downloading) {
                const progress = this.downloadedChunks / this.TOTAL_CHUNKS;
                const done = this.downloadedChunks === this.TOTAL_CHUNKS;
                this.downloading = !done;
                callback(progress, done);
                if (done) break;
                if (!done) {
                    await delay(400);
                    this.downloadedChunks++;
                }
            }
            this.downloading = false;
        })();
    }

    cancelDownload(): boolean {
        const cancelled = this.downloading;
        this.downloading = false;
        return cancelled;
    }

    async loadOnGpu(): Promise<LlmModel> {
        await delay(10000);
        return new DummyLlmModel();
    }
}
