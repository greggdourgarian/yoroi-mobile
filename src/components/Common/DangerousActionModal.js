// @flow

import React from 'react'
import {View, Image, ScrollView} from 'react-native'
import {compose} from 'redux'
import {withStateHandlers} from 'recompose'
import {injectIntl, intlShape} from 'react-intl'

import {Text, Button, Modal, Checkbox} from '../UiKit'
import globalMessages, {confirmationMessages} from '../../i18n/global-messages'
import image from '../../assets/img/alert-circle.png'

import styles from './styles/DangerousActionModal.style'

import type {ComponentType} from 'react'

type Props = {
  +intl: intlShape,
  +visible: boolean,
  +title: string,
  +children: React$Node,
  +alertBox?: {
    title?: string,
    content: Array<string>,
  },
  +onRequestClose: () => void,
  +primaryButton: {|
    +label: string,
    +onPress: (void) => PossiblyAsync<void>,
  |},
  +secondaryButton?: {|
    label?: string,
    onPress: (void) => void,
    primary?: boolean,
  |},
  +checkboxLabel?: string,
  isChecked: boolean,
  +toogleCheck: (accepted: boolean) => void,
  +showCloseIcon?: boolean,
}

const DangerousActionModal = ({
  intl,
  visible,
  title,
  children,
  alertBox,
  onRequestClose,
  primaryButton,
  secondaryButton,
  checkboxLabel,
  isChecked,
  toogleCheck,
  showCloseIcon,
}: Props) => (
  <Modal
    visible={visible}
    onRequestClose={onRequestClose}
    showCloseIcon={showCloseIcon === true}
  >
    <ScrollView style={styles.scrollView}>
      <View style={styles.content}>
        <View style={styles.heading}>
          <Text style={styles.titleText}>{title}</Text>
        </View>

        {children}

        {alertBox != null && (
          <View style={styles.alertBlock}>
            <View style={styles.heading}>
              <Image source={image} style={styles.image} />
              <Text style={[styles.titleText, styles.alertText]}>
                {alertBox.title != null
                  ? alertBox.title
                  : intl.formatMessage(globalMessages.attention)}
              </Text>
            </View>
            {alertBox.content.map((line, i) => (
              <Text key={i} style={[styles.paragraph, styles.alertText]}>
                {line}
              </Text>
            ))}
          </View>
        )}

        <Checkbox
          onChange={toogleCheck}
          checked={isChecked}
          text={
            /* eslint-disable indent */
            checkboxLabel != null
              ? checkboxLabel
              : intl.formatMessage(
                  confirmationMessages.commonButtons.iUnderstandButton,
                )
            /* eslint-enable indent */
          }
        />
      </View>
      <View style={styles.buttons}>
        <Button
          block
          onPress={primaryButton.onPress}
          title={primaryButton.label}
          style={styles.primaryButton}
        />
        <Button
          block
          disabled={!isChecked}
          onPress={
            secondaryButton != null ? secondaryButton.onPress : onRequestClose
          }
          title={
            secondaryButton?.label ??
            intl.formatMessage(confirmationMessages.commonButtons.cancelButton)
          }
          style={styles.secondaryButton}
        />
      </View>
    </ScrollView>
  </Modal>
)

export default injectIntl(
  (compose(
    withStateHandlers(
      {
        isChecked: false,
      },
      {
        toogleCheck: () => (isChecked) => ({isChecked}),
      },
    ),
  )(DangerousActionModal): ComponentType<Props>),
)
