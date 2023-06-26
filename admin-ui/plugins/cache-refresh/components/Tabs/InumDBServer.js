import { useFormik } from 'formik'
import React, { useContext, useState } from 'react'
import { Row, Col, Form, FormGroup } from '../../../../app/components'
import { Button } from 'Components'
import GluuInputRow from 'Routes/Apps/Gluu/GluuInputRow'
import GluuCheckBoxRow from 'Routes/Apps/Gluu/GluuCheckBoxRow'
import { useDispatch, useSelector } from 'react-redux'
import GluuProperties from 'Routes/Apps/Gluu/GluuProperties'
import GluuLabel from 'Routes/Apps/Gluu/GluuLabel'
import { t } from 'i18next'
import { ThemeContext } from '../../../../app/context/theme/themeContext'
import BindPasswordModal from '../CacheRefreshManagement/BindPasswordModal'
import * as Yup from 'yup'
import GluuCommitFooter from 'Routes/Apps/Gluu/GluuCommitFooter'
import { isEmpty } from 'lodash'
import { putCacheRefreshConfiguration } from '../../redux/features/CacheRefreshSlice'
import GluuCommitDialog from 'Routes/Apps/Gluu/GluuCommitDialog'

const isStringsArray = (arr) => arr.every((i) => typeof i === 'string')
const convertToStringArray = (arr) => {
  return arr.map((item) => item.value)
}

const InumDBServer = () => {
  const theme = useContext(ThemeContext)
  const selectedTheme = theme.state.theme
  const dispatch = useDispatch()
  const cacheRefreshConfiguration = useSelector(
    (state) => state.cacheRefreshReducer.configuration
  )
  const { defaultInumServer, inumConfig } = useSelector(
    (state) => state.cacheRefreshReducer.configuration
  )
  const initialValues = {
    defaultInumServer: defaultInumServer || false,
    inumConfig: {
      ...inumConfig,
      servers: inumConfig?.servers || [],
      baseDNs: inumConfig?.baseDNs || [],
      bindPassword: inumConfig?.bindPassword || null,
    },
  }

  const [modal, setModal] = useState(false)
  const toggle = () => {
    setModal(!modal)
  }

  const [auditModal, setAuditModal] = useState(false)
  const toggleAudit = () => {
    setAuditModal(!modal)
  }

  const formik = useFormik({
    initialValues: initialValues,
    validationSchema: Yup.object({
      defaultInumServer: Yup.boolean(),
      inumConfig: Yup.object()
        .shape()
        .when('defaultInumServer', {
          is: false,
          then: () =>
            Yup.object({
              configId: Yup.string().required(
                `${t('fields.name')} ${t('messages.is_required')}`
              ),
              bindDN: Yup.string().required(
                `${t('fields.bind_dn')} ${t('messages.is_required')}`
              ),
              maxConnections: Yup.string().required(
                `${t('fields.max_connections')} ${t('messages.is_required')}`
              ),
              servers: Yup.array().min(
                1,
                `${t('fields.server_port')} ${t('messages.is_required')}`
              ),
              baseDNs: Yup.array().min(
                1,
                `${t('fields.base_dns')} ${t('messages.is_required')}`
              ),
            }),
        }),
    }),
    setFieldValue: (field) => {
      delete values[field]
    },
    onSubmit: (data) => {
      if (isEmpty(formik.errors)) {
        toggleAudit()
      }
    },
  })

  const submitForm = () => {
    toggleAudit()

    dispatch(
      putCacheRefreshConfiguration({
        cacheRefreshConfiguration: {
          ...cacheRefreshConfiguration,
          inumConfig: {
            ...formik.values.inumConfig,
            baseDNs: isStringsArray(formik.values.inumConfig.baseDNs || [])
              ? formik.values.inumConfig.baseDNs
              : convertToStringArray(formik.values?.inumConfig.baseDNs || []),
            servers: isStringsArray(formik.values.inumConfig.servers || [])
              ? formik.values.inumConfig.servers
              : convertToStringArray(formik.values?.inumConfig.servers || []),
          },
          defaultInumServer: formik.values.defaultInumServer,
        },
      })
    )
  }

  const handleChangePassword = (updatedPassword) => {
    dispatch(
      putCacheRefreshConfiguration({
        cacheRefreshConfiguration: {
          ...cacheRefreshConfiguration,
          inumConfig: {
            ...formik.values.inumConfig,
            bindPassword: updatedPassword,
          },
        },
      })
    )
  }

  return (
    <Form
      onSubmit={(e) => {
        e.preventDefault()
        formik.handleSubmit()
      }}
      className='mt-4'
    >
      <FormGroup row>
        <Col sm={8}>
          <GluuCheckBoxRow
            label='fields.default_inum_server'
            name='defaultInumServer'
            handleOnChange={(e) => {
              formik.setFieldValue('defaultInumServer', e.target.checked)
            }}
            lsize={4}
            rsize={8}
            value={formik.values.defaultInumServer}
          />
        </Col>
        {!formik.values.defaultInumServer && (
          <>
            <Col sm={8}>
              <GluuInputRow
                label='fields.name'
                name='inumConfig.configId'
                value={formik.values.inumConfig?.configId || ''}
                formik={formik}
                lsize={4}
                rsize={8}
                required
                showError={
                  formik.errors.inumConfig?.configId &&
                  formik.touched.inumConfig?.configId
                }
                errorMessage={formik.errors.inumConfig?.configId}
              />
            </Col>
            <Col sm={8}>
              <GluuInputRow
                label='fields.bind_dn'
                name='inumConfig.bindDN'
                value={formik.values.inumConfig?.bindDN || ''}
                formik={formik}
                lsize={4}
                rsize={8}
                required
                showError={
                  formik.errors.inumConfig?.bindDN &&
                  formik.touched.inumConfig?.bindDN
                }
                errorMessage={formik.errors.inumConfig?.bindDN}
              />
            </Col>
            <Col sm={8}>
              <GluuInputRow
                label='fields.max_connections'
                name='inumConfig.maxConnections'
                value={formik.values.inumConfig?.maxConnections || ''}
                formik={formik}
                type='number'
                lsize={4}
                rsize={8}
                required
                showError={
                  formik.errors.inumConfig?.maxConnections &&
                  formik.touched.inumConfig?.maxConnections
                }
                errorMessage={formik.errors.inumConfig?.maxConnections}
              />
            </Col>
            <Col sm={8}>
              <Row>
                <GluuLabel required label='fields.server_port' size={4} />
                <Col sm={8}>
                  <GluuProperties
                    compName='inumConfig.servers'
                    isInputLables={true}
                    formik={formik}
                    options={
                      formik.values.inumConfig?.servers
                        ? formik.values.inumConfig?.servers.map((item) => ({
                            key: '',
                            value: item,
                          }))
                        : []
                    }
                    isKeys={false}
                    buttonText='actions.add_server'
                    showError={
                      formik.errors.targetConfig?.servers ? true : false
                    }
                    errorMessage={formik.errors.targetConfig?.servers}
                  />
                </Col>
              </Row>
            </Col>
            <Col sm={8}>
              <Row className='mt-4'>
                <GluuLabel required label='fields.base_dns' size={4} />
                <Col sm={8}>
                  <GluuProperties
                    compName='inumConfig.baseDNs'
                    isInputLables={true}
                    formik={formik}
                    options={
                      formik.values.inumConfig?.baseDNs
                        ? formik.values.inumConfig?.baseDNs.map((item) => ({
                            key: '',
                            value: item,
                          }))
                        : []
                    }
                    isKeys={false}
                    buttonText='actions.add_base_dn'
                    showError={
                      formik.errors.targetConfig?.baseDNs ? true : false
                    }
                    errorMessage={formik.errors.targetConfig?.baseDNs}
                  />
                </Col>
              </Row>
            </Col>
            <Row>
              <Col sm={2} className='mt-3'>
                <Button
                  type='button'
                  color={`primary-${selectedTheme}`}
                  className='theme-config__trigger mt-3'
                  onClick={toggle}
                >
                  {t('actions.change_bind_password')}
                </Button>
              </Col>
            </Row>
            <Col sm={8} className='mt-3'>
              <GluuCheckBoxRow
                label='fields.use_ssl'
                name='inumConfig.useSSL'
                required
                handleOnChange={(e) => {
                  formik.setFieldValue('inumConfig.useSSL', e.target.checked)
                }}
                lsize={4}
                rsize={8}
                value={formik.values.inumConfig?.useSSL}
              />
            </Col>
          </>
        )}
      </FormGroup>
      <Row>
        <Col>
          <GluuCommitFooter
            hideButtons={{ save: true, back: false }}
            type='submit'
            saveHandler={toggleAudit}
          />
        </Col>
      </Row>
      {modal && (
        <BindPasswordModal
          handleChangePassword={handleChangePassword}
          handler={toggle}
          isOpen={modal}
        />
      )}
      <GluuCommitDialog
        handler={toggleAudit}
        modal={auditModal}
        onAccept={submitForm}
        formik={formik}
      />
    </Form>
  )
}

export default InumDBServer
