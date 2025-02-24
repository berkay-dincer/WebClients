import { useEffect } from 'react';

import { useActiveShare } from '../../../../../hooks/drive/useActiveShare';
import { useFolderTree } from '../../../../../store';
import type { Device } from '../../../../../store/_devices';
import ExpandButton from '../DriveSidebarFolders/DriveExpandButton';
import DriveSidebarSubfolders from '../DriveSidebarFolders/DriveSidebarSubfolders';
import DriveSidebarListItem from '../DriveSidebarListItem';
import { generateSidebarItemStyle } from '../utils';

export const SidebarDeviceItem = ({
    device,
    setSidebarLevel,
}: {
    device: Device;
    setSidebarLevel: (level: number) => void;
}) => {
    const { activeFolder } = useActiveShare();
    const { deepestOpenedLevel, rootFolder, toggleExpand } = useFolderTree(device.shareId, {
        rootLinkId: device.linkId,
    });

    useEffect(() => {
        setSidebarLevel(deepestOpenedLevel);
    }, [deepestOpenedLevel]);

    const isActive = activeFolder.shareId === device.shareId && activeFolder.linkId === device.linkId;

    return (
        <div>
            <DriveSidebarListItem
                to={`/${device.shareId}/folder/${device.linkId}`}
                icon="tv"
                shareId={device.shareId}
                isActive={() => isActive}
                style={generateSidebarItemStyle(1)}
            >
                <span className="text-ellipsis" title={device.name} data-testid="sidebar-device-name">
                    {device.name}
                </span>
                <ExpandButton
                    className="shrink-0"
                    expanded={Boolean(rootFolder?.isExpanded)}
                    onClick={() => toggleExpand(device.linkId)}
                />
            </DriveSidebarListItem>
            <DriveSidebarSubfolders
                shareId={device.shareId}
                rootFolder={rootFolder}
                toggleExpand={toggleExpand}
                defaultLevel={1}
            />
        </div>
    );
};
