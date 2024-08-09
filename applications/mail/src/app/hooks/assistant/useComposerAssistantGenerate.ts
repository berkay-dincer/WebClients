import { useState } from 'react';

import { useAssistantSubscriptionStatus, useUserSettings } from '@proton/components/hooks';
import useAssistantTelemetry from '@proton/components/hooks/assistant/useAssistantTelemetry';
import { useAssistant } from '@proton/llm/lib';
import type {
    Action,
    ActionType,
    PartialRefineAction,
    RefineAction,
    RefineActionType,
    RefineLocation,
} from '@proton/llm/lib/types';
import { OpenedAssistantStatus, isPredefinedRefineActionType, isRefineActionType } from '@proton/llm/lib/types';
import type { Recipient } from '@proton/shared/lib/interfaces';
import { AI_ASSISTANT_ACCESS } from '@proton/shared/lib/interfaces';

import { removeLineBreaks } from 'proton-mail/helpers/string';

export enum ASSISTANT_INSERT_TYPE {
    INSERT = 'INSERT',
    REPLACE = 'REPLACE',
}

export interface GenerateResultProps {
    actionType?: ActionType;
    setShouldShowRefineButtons?: (value: boolean) => void;
    assistantRequest: string;
    setAssistantRequest?: (value: string) => void;
}

interface Props {
    assistantID: string;
    showAssistantSettingsModal: () => void;
    showResumeDownloadModal: () => void;
    showUpsellModal: () => void;
    onResetFeedbackSubmitted: () => void;
    expanded: boolean;
    recipients: Recipient[];
    sender: Recipient | undefined;
    getContentBeforeBlockquote: () => string;
    checkScrollButtonDisplay: () => boolean | undefined;
    selectedText: string | undefined;
    composerSelectedText: string;
    onUseGeneratedText: (value: string) => void;
    onUseRefinedText: (value: string) => void;
    setContentBeforeBlockquote: (content: string) => void;
    prompt: string;
    setPrompt: (value: string) => void;
}

const useComposerAssistantGenerate = ({
    assistantID,
    showAssistantSettingsModal,
    showResumeDownloadModal,
    showUpsellModal,
    onResetFeedbackSubmitted,
    expanded,
    recipients,
    sender,
    getContentBeforeBlockquote,
    checkScrollButtonDisplay,
    selectedText,
    composerSelectedText,
    onUseGeneratedText,
    onUseRefinedText,
    setContentBeforeBlockquote,
    prompt,
    setPrompt,
}: Props) => {
    // Contains the current generation result that is visible in the assistant context
    const [generationResult, setGenerationResult] = useState('');
    // Contains the previous generation result.
    // When the user is generating a new text over a generated text and cancels it,
    // we want to fall back to the previous text instead of seeing a partial generation
    const [previousGenerationResult, setPreviousGenerationResult] = useState('');

    const [submittedPrompt, setSubmittedPrompt] = useState('');

    const [{ AIAssistantFlags, Locale: locale }] = useUserSettings();
    const { trialStatus, start: startTrial } = useAssistantSubscriptionStatus();
    const { downloadPaused, generateResult, setAssistantStatus } = useAssistant(assistantID);
    const { sendUseAnswerAssistantReport } = useAssistantTelemetry();

    const handleStartTrial = () => {
        let trialStarted = false;
        if (!trialStarted && trialStatus === 'trial-not-started') {
            trialStarted = true;
            void startTrial();
        }
    };

    const handleSetResult = (text: string) => {
        setGenerationResult(text);
        checkScrollButtonDisplay();
    };

    const handleSetGenerationResult = (fulltext: string, prompt?: string): void => {
        handleStartTrial();
        handleSetResult(fulltext);
        setSubmittedPrompt(prompt ?? '');
    };

    /* Refine with selection */

    const handleRefineEditorContent = async (partialAction: PartialRefineAction) => {
        if (selectedText) {
            /** There are 2 types of refine
             * 1- Refine text that is selected in the editor
             *      => We have a selected text in the editor
             *          && there is no result generated (otherwise, we are trying to refine a generated text, and we fall in the 2nd case)
             * 2- Refine selection of the text generated by the assistant. The user wants to improve it before inserting it.
             */
            if (composerSelectedText && !generationResult) {
                /** In the first case, when we have an input selected text (text coming from the editor),
                 * we can add the entire generated text inside the assistant result.
                 * To generate a result, we are sending to the llm manager:
                 * - The refine prompt
                 * - The full email in plaintext
                 * - The start and end index of the selection within the full email
                 */
                const plain = removeLineBreaks(getContentBeforeBlockquote());
                const idxStart = plain.indexOf(removeLineBreaks(selectedText));
                const idxEnd = idxStart + removeLineBreaks(selectedText).length;

                const action: RefineAction = {
                    ...partialAction,
                    fullEmail: plain,
                    idxStart,
                    idxEnd,
                };
                await generateResult({
                    action,
                    callback: (res) => handleSetGenerationResult(res),
                    hasSelection: !!selectedText,
                });
            } else {
                /** In the second case, when we want to refine selection of the text generated by the assistant before importing it,
                 * we don't want to erase the full assistant result while generating.
                 * We want to replace the part that is being refined.
                 * In that case, we will get the text before the selection and the text after the selection so that we can replace
                 * the old text with the new generated text.
                 * To generate a result, we are sending to the llm manager:
                 * - The refine prompt
                 * - The previous generated text
                 * - The start and end index of the selection within the previous generated text
                 */
                const idxStart = generationResult.indexOf(selectedText);
                const idxEnd = idxStart + selectedText.length;
                const beforeSelection = generationResult.slice(0, idxStart);
                const afterSelection = generationResult.slice(idxEnd, generationResult.length);

                const handleInsertRefineInGenerationResult = (textToReplace: string) => {
                    handleStartTrial();
                    const newResult = `${beforeSelection}${textToReplace}${afterSelection}`;
                    handleSetResult(newResult);
                };

                const action = {
                    ...partialAction,
                    fullEmail: generationResult,
                    idxStart,
                    idxEnd,
                };
                await generateResult({
                    action,
                    callback: handleInsertRefineInGenerationResult,
                    hasSelection: !!selectedText,
                });
            }
        }
    };

    const refineWithSelection = async (assistantRequest: string, actionType: RefineActionType) => {
        let partialAction: PartialRefineAction;
        if (isPredefinedRefineActionType(actionType)) {
            partialAction = {
                type: actionType,
            };
        } else {
            partialAction = {
                type: actionType,
                prompt: assistantRequest,
            };
        }

        await handleRefineEditorContent(partialAction); // refine location (idxStart/idxEnd) is set later
    };

    /* Generation related */
    const getEmailContentsForRefinement = () => {
        const composerContent = removeLineBreaks(getContentBeforeBlockquote());
        if (expanded && generationResult) {
            return generationResult;
        } else if (composerContent) {
            return composerContent;
        }
    };

    const buildAction = (assistantRequest: string, actionType: ActionType): Action | undefined => {
        if (actionType === 'writeFullEmail') {
            return {
                type: 'writeFullEmail',
                prompt: assistantRequest,
                recipient: recipients?.[0]?.Name,
                sender: sender?.Name,
                locale,
            };
        }

        const fullEmail = getEmailContentsForRefinement();
        if (!fullEmail) {
            return undefined;
        }

        const refineLocation: RefineLocation = {
            fullEmail,
            idxStart: 0,
            idxEnd: fullEmail.length,
        };

        // Predefined refine (shorten, proofread etc)
        if (isPredefinedRefineActionType(actionType)) {
            return {
                type: actionType,
                ...refineLocation,
            };
        }

        // Custom refine (with user prompt)
        return {
            type: actionType,
            prompt: assistantRequest,
            ...refineLocation,
        };
    };

    const generate = async ({ actionType }: GenerateResultProps) => {
        // If user hasn't set the assistant yet, invite him to do so
        if (AIAssistantFlags === AI_ASSISTANT_ACCESS.UNSET) {
            showAssistantSettingsModal();
            return;
        }

        // Warn the user that we need the download to be completed before generating a result
        if (downloadPaused) {
            showResumeDownloadModal();
            return;
        }

        // Stop if trial ended
        if (trialStatus === 'trial-ended') {
            showUpsellModal();
            return;
        }

        // Store previous generation in case the user cancels the current one (we'll have to revert it)
        if (generationResult) {
            setPreviousGenerationResult(generationResult);
        }

        onResetFeedbackSubmitted();

        // If actionType is undefined, it means we're being called with a user request
        // (user has typed stuff the AI input field), but caller doesn't know if this
        // has to be applied to full message generation or refinement of a specific part.
        if (!actionType) {
            actionType = !!selectedText ? 'customRefine' : 'writeFullEmail';
        }

        const generateType = (() => {
            const isRefineAction = isRefineActionType(actionType);
            if (isRefineAction && !!selectedText) {
                return 'refine-with-selection';
            }
            if (isRefineAction) {
                return 'refine';
            }

            return 'generate';
        })();

        if (generateType === 'refine-with-selection') {
            await refineWithSelection(prompt, actionType as RefineActionType);
        }

        if (generateType === 'refine') {
            // Empty the user request field after they typed Enter
            setPrompt('');

            const action = buildAction(prompt, actionType);
            if (action) {
                await generateResult({
                    action,
                    callback: (res) => {
                        handleSetGenerationResult(res, prompt);
                    },
                    hasSelection: !!selectedText,
                });
            }
        }

        if (generateType === 'generate') {
            const action = buildAction(prompt, actionType);
            if (action) {
                await generateResult({
                    action,
                    callback: (res) => {
                        handleSetGenerationResult(res, prompt);
                    },
                    hasSelection: !!selectedText,
                });
            }
        }
    };

    /* Insert generation in composer */

    // This function defines what happens when the user commits the proposed generation with the button "Add" or "Replace".
    const replaceMessageBody = async (action: ASSISTANT_INSERT_TYPE) => {
        /**
         * There are 3 different usages of the generated text:
         * 1- Insert text at the beginning of the composer, when there is no selected text in the editor
         * 2- Replace text in the composer where the current selection is
         * 3- Replace the full message body (signature and blockquote excluded)
         */
        const replacementStyle = (() => {
            if (action === ASSISTANT_INSERT_TYPE.REPLACE) {
                if (composerSelectedText) {
                    return 'refineSelectedText';
                }
                return 'refineFullMessage';
            }

            return 'generateFullMessage';
        })();

        if (replacementStyle === 'generateFullMessage') {
            onUseGeneratedText(generationResult);
        }

        if (replacementStyle === 'refineSelectedText') {
            onUseRefinedText(generationResult);
        }

        if (replacementStyle === 'refineFullMessage') {
            setContentBeforeBlockquote(generationResult);
        }

        sendUseAnswerAssistantReport(action);
        setAssistantStatus(assistantID, OpenedAssistantStatus.COLLAPSED);
        setGenerationResult('');
    };

    return {
        generationResult,
        setGenerationResult,
        previousGenerationResult,
        setPreviousGenerationResult,
        generate,
        replaceMessageBody,
        submittedPrompt,
    };
};

export default useComposerAssistantGenerate;
