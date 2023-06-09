import React from 'react';
import {View, StyleSheet} from 'react-native';
import {CircleActionButton} from '../CircleActionButton';

interface IndividualSessionProps {
  setCopyDialog: (arg0: boolean) => void;
  handleWebView: (arg0: boolean) => void;
  leftAligned: boolean;
}

/* // ToDo: Add in QR Modal Module */
const ActionButtons = ({
  setCopyDialog,
  handleWebView,
  leftAligned,
}: IndividualSessionProps) => {
  return (
    <View
      style={
        leftAligned ? styles.absoluteFlexRowLeft : styles.absoluteFlexRowRight
      }>
      <CircleActionButton
        copyImage={true}
        handlePress={() => {
          setCopyDialog(true);
        }}
      />
      <CircleActionButton
        copyImage={false}
        handlePress={() => {
          handleWebView(true);
          console.log('logging...');
        }}
      />
    </View>
  );
};

export default ActionButtons;

const styles = StyleSheet.create({
  absoluteFlexRowLeft: {
    position: 'absolute',
    bottom: 50,
    right: 0,
    display: 'flex',
    flexDirection: 'row',
  },
  absoluteFlexRowRight: {
    position: 'absolute',
    bottom: 50,
    left: 12,
    display: 'flex',
    flexDirection: 'row',
  },
});
