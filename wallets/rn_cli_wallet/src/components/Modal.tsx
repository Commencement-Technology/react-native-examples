import {useSnapshot} from 'valtio';
import {useCallback, useMemo} from 'react';
import {View} from 'react-native';
import RNModal from 'react-native-modal';

import ModalStore from '@/store/ModalStore';
import SessionProposalModal from '@/modals/SessionProposalModal';
import SessionSignModal from '@/modals/SessionSignModal';
import SessionSendTransactionModal from '@/modals/SessionSendTransactionModal';
import SessionSignTypedDataModal from '@/modals/SessionSignTypedDataModal';
import {LoadingModal} from '@/modals/LoadingModal';

export default function Modal() {
  const {open, view} = useSnapshot(ModalStore.state);
  // handle the modal being closed by click outside
  const onClose = useCallback(() => {
    if (open) {
      ModalStore.close();
    }
  }, [open]);

  const componentView = useMemo(() => {
    switch (view) {
      case 'SessionProposalModal':
        return <SessionProposalModal />;
      case 'SessionSignModal':
        return <SessionSignModal />;
      case 'SessionSignTypedDataModal':
        return <SessionSignTypedDataModal />;
      case 'SessionSendTransactionModal':
        return <SessionSendTransactionModal />;
      case 'LoadingModal':
        return <LoadingModal />;
      default:
        return <View />;
    }
  }, [view]);

  return (
    <RNModal
      backdropOpacity={0.6}
      hideModalContentWhileAnimating
      onBackdropPress={onClose}
      onModalHide={onClose}
      isVisible={open}>
      {componentView}
    </RNModal>
  );
}
