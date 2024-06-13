import { ReactNode } from 'react';
import { Route, Switch, useRouteMatch } from 'react-router-dom';

import { PrivateMainSettingsArea } from '@proton/components';
import { PassEvents } from '@proton/components';
import { getSectionPath } from '@proton/components/containers/layout/helper';

import PassDownloadsSettingsPage from './pages/PassDownloadsSettingsPage';
import type { getPassAppRoutes } from './routes';

const PassSettingsRouter = ({
    passAppRoutes,
    redirect,
}: {
    passAppRoutes: ReturnType<typeof getPassAppRoutes>;
    redirect: ReactNode;
}) => {
    const { path } = useRouteMatch();

    const {
        routes: { downloads, activityLogs },
    } = passAppRoutes;

    return (
        <Switch>
            <Route path={getSectionPath(path, downloads)}>
                <PrivateMainSettingsArea config={downloads}>
                    <PassDownloadsSettingsPage />
                </PrivateMainSettingsArea>
            </Route>
            <Route path={getSectionPath(path, activityLogs)}>
                <PrivateMainSettingsArea config={activityLogs}>
                    <PassEvents />
                </PrivateMainSettingsArea>
            </Route>
            {redirect}
        </Switch>
    );
};

export default PassSettingsRouter;
