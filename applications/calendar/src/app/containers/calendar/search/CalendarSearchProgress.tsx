import { c, msgid } from 'ttag';

import { Progress } from '@proton/components/components';
import { ESIndexingState } from '@proton/encrypted-search/lib';
import clsx from '@proton/utils/clsx';

const getProgressStatusText = ({
    isEstimating,
    current,
    total,
}: {
    isEstimating: boolean;
    current: number;
    total: number;
}) => {
    if (isEstimating) {
        return c('Info').t`Estimating time remaining...`;
    } else {
        // translator: current is a number representing how many events have been indexed already, total is the total number of events in all user calendars
        return c('Info').t`Indexing events: ${current}/${total}`;
    }
};

interface Props {
    esState: ESIndexingState;
}

const CalendarSearchProgress = ({ esState }: Props) => {
    const { estimatedMinutes, totalIndexingItems, esProgress, currentProgressValue } = esState;

    const isEstimating = estimatedMinutes === 0 && (totalIndexingItems === 0 || esProgress !== totalIndexingItems);
    const etaMessage =
        estimatedMinutes <= 1
            ? c('Info').t`Estimated time remaining: Less than a minute`
            : // translator: the variable is a positive integer (written in digits) always strictly bigger than 1
              c('Info').ngettext(
                  msgid`Estimated time remaining: ${estimatedMinutes} minute`,
                  `Estimated time remaining: ${estimatedMinutes} minutes`,
                  estimatedMinutes
              );
    const statusMessage = getProgressStatusText({
        isEstimating,
        current: esProgress,
        total: totalIndexingItems,
    });

    return (
        <div className="mt-6 flex flex-column">
            <span className="color-weak relative advanced-search-progress-status" aria-live="polite" aria-atomic="true">
                {statusMessage}
            </span>
            <div className="flex flex-justify-space-between">
                <Progress
                    value={currentProgressValue}
                    aria-describedby="timeRemaining"
                    className={clsx(['my-2 flex-item-fluid'])}
                />
            </div>
            <span
                id="timeRemaining"
                aria-live="polite"
                aria-atomic="true"
                className={clsx([
                    'color-weak relative advanced-search-time-remaining',
                    isEstimating ? 'visibility-hidden' : undefined,
                ])}
            >
                {etaMessage}
            </span>
        </div>
    );
};

export default CalendarSearchProgress;
