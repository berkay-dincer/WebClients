import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { usePlans } from '@proton/account/plans/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { type Currency, type FullPlansMap, getPlansMap as getPlansMapInner } from '@proton/payments';

import { type GetPreferredCurrencyParamsHook, useCurrencies } from '../payments/client-extensions/useCurrencies';

type PreferredPlansMapHook = {
    plansMapLoading: boolean;
    plansMap: FullPlansMap;
    getPlansMap: (overrides?: GetPreferredCurrencyParamsHook) => {
        plansMap: FullPlansMap;
        preferredCurrency: Currency;
    };
    preferredCurrency: Currency;
};

export const usePreferredPlansMap = (currencyFallback?: boolean): PreferredPlansMapHook => {
    const [plans, plansLoading] = usePlans();
    const [status, statusLoading] = usePaymentStatus();
    const [subscription, subscriptionLoading] = useSubscription();
    const [user] = useUser();
    const { getPreferredCurrency } = useCurrencies();

    const getPlansMap = (overrides: GetPreferredCurrencyParamsHook = {}) => {
        const preferredCurrency = getPreferredCurrency({
            ...overrides,
            user,
            subscription,
            plans: plans?.plans,
            status,
        });

        return {
            preferredCurrency,
            plansMap: getPlansMapInner(plans?.plans ?? [], preferredCurrency, currencyFallback),
        };
    };

    return {
        ...getPlansMap(),
        getPlansMap,
        plansMapLoading: plansLoading || statusLoading || subscriptionLoading,
    };
};
