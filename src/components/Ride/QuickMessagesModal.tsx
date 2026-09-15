import React from 'react';
import { ChatModal } from './ChatModal';

interface QuickMessagesModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSendMessage?: (msg: string) => void;
    rideId?: string;
    passengerName?: string;
    driverName?: string;
    driverId?: string;
}

export const QuickMessagesModal: React.FC<QuickMessagesModalProps> = ({
    isOpen,
    onClose,
    onSendMessage,
    rideId = 'active-ride',
    passengerName = 'Passageiro',
    driverName = 'Você',
    driverId,
}) => {
    return (
        <ChatModal
            isOpen={isOpen}
            onClose={onClose}
            rideId={rideId}
            passengerName={passengerName}
            driverName={driverName}
            driverId={driverId}
            onSendMessage={onSendMessage}
        />
    );
};
