import React, { useContext, useEffect, useRef, useState } from 'react'
import { Card, CardBody, Form, FormGroup, Col, Row, Button } from 'Components'
import Toggle from 'react-toggle'
import { useFormik } from 'formik'
import GluuInputRow from 'Routes/Apps/Gluu/GluuInputRow'
import GluuLabel from 'Routes/Apps/Gluu/GluuLabel'
import GluuCommitDialog from 'Routes/Apps/Gluu/GluuCommitDialog'
import GluuCommitFooter from 'Routes/Apps/Gluu/GluuCommitFooter'
import { useDispatch, useSelector } from 'react-redux'
import * as Yup from 'yup'
import { useTranslation } from 'react-i18next'
import { ThemeContext } from 'Context/theme/themeContext'
import applicationStyle from 'Routes/Apps/Gluu/styles/applicationstyle'
import {
  createSamlIdentity,
  toggleSavedFormFlag,
  updateSamlIdentity,
} from 'Plugins/saml/redux/features/SamlSlice'
import PropTypes from 'prop-types'
import { useNavigate } from 'react-router'
import GluuLoader from 'Routes/Apps/Gluu/GluuLoader'
import { Box } from '@mui/material'
import GluuToggleRow from 'Routes/Apps/Gluu/GluuToggleRow'

const SamlIdpForm = ({ configs, viewOnly }) => {
  const [showUploadBtn, setShowUploadBtn] = useState(false)
  const [fileError, setFileError] = useState(false)
  const savedForm = useSelector((state) => state.idpSamlReducer.savedForm)
  const loading = useSelector((state) => state.idpSamlReducer.loading)
  const { t } = useTranslation()
  const inputFile = useRef(null)
  const dispatch = useDispatch()
  const [modal, setModal] = useState(false)
  const navigate = useNavigate()
  const theme = useContext(ThemeContext)
  const selectedTheme = theme.state.theme

  const [metaDataFile, setMetadaDataFile] = useState(null)
  const initialValues = {
    ...(configs || {}),
    name: configs?.name || '',
    nameIDPolicyFormat: configs?.nameIDPolicyFormat || '',
    singleSignOnServiceUrl: configs?.singleSignOnServiceUrl || '',
    idpEntityId: configs?.idpEntityId || '',
    displayName: configs?.displayName || '',
    description: configs?.description || '',
    realm: configs?.realm || '',
    importMetadataFile: false,
    enabled: configs?.enabled || false,
  }

  const validationSchema = Yup.object().shape({
    singleSignOnServiceUrl: Yup.string().when('importMetadataFile', {
      is: (value) => {
        return value === false
      },
      then: () =>
        Yup.string().required(
          `${t('fields.single_signon_service_url')} is Required!`
        ),
    }),
    idpEntityId: Yup.string().when('importMetadataFile', {
      is: (value) => {
        return value === false
      },
      then: () =>
        Yup.string().required(`${t('fields.idp_entity_id')} is Required!`),
    }),
    nameIDPolicyFormat: Yup.string().when('importMetadataFile', {
      is: (value) => {
        return value === false
      },
      then: () =>
        Yup.string().required(`${t('fields.name_policy_format')} is Required!`),
    }),
    name: Yup.string().required(`${t('fields.name')} is Required!`),
    realm: Yup.string().required(`${t('fields.realm')} is Required!`),
  })

  const toggle = () => {
    setModal(!modal)
  }

  const formik = useFormik({
    initialValues,
    validationSchema,
    onSubmit: () => {
      toggle()
    },
  })

  const onHandleFileSelection = () => {
    setFileError(false)
    inputFile.current.click()
  }

  const handleFileChange = (event) => {
    const file = event.target.files[0]

    if (!file) {
      formik.setFieldValue('importMetadataFile', false)
    } else {
      formik.setFieldValue('importMetadataFile', true)
      setMetadaDataFile(file)
    }
  }

  const submitForm = (messages) => {
    toggle()
    handleSubmit(formik.values, messages)
  }

  function handleSubmit(values, user_message) {
    delete values.importMetadataFile
    let formdata = new FormData()

    let payload = {
      identityProvider: { ...values },
    }

    if (metaDataFile) {
      payload.metaDataFile = metaDataFile

      const blob = new Blob([payload.metaDataFile], {
        type: 'application/octet-stream',
      })
      formdata.append('metaDataFile', blob)
    }

    const blob = new Blob(
      [
        JSON.stringify({
          ...payload.identityProvider,
        }),
      ],
      {
        type: 'application/json',
      }
    )

    formdata.append('identityProvider', blob)

    if (!configs) {
      dispatch(
        createSamlIdentity({
          action: { action_message: user_message, action_data: formdata },
        })
      )
    } else {
      dispatch(
        updateSamlIdentity({
          action: { action_message: user_message, action_data: formdata },
        })
      )
    }
  }

  useEffect(() => {
    if (savedForm) {
      navigate('/saml/identity-providers')
    }

    return () => {
      dispatch(toggleSavedFormFlag(false))
    }
  }, [savedForm])

  return (
    <GluuLoader blocking={loading}>
      <Card>
        <CardBody className=''>
          <Form
            onSubmit={(event) => {
              event.preventDefault()
              if (!metaDataFile && showUploadBtn) {
                setFileError(true)
                return
              }
              setFileError(false)
              formik.handleSubmit(event)
            }}
            className='mt-4'
          >
            <FormGroup row>
              <Col sm={10}>
                <GluuInputRow
                  label='fields.name'
                  name='name'
                  value={formik.values.name || ''}
                  formik={formik}
                  lsize={4}
                  required
                  rsize={8}
                  showError={formik.errors.name && formik.touched.name}
                  errorMessage={formik.errors.name}
                  disabled={viewOnly}
                />
              </Col>
              <Col sm={10}>
                <GluuInputRow
                  label='fields.displayName'
                  name='displayName'
                  value={formik.values.displayName || ''}
                  formik={formik}
                  lsize={4}
                  rsize={8}
                  showError={
                    formik.errors.displayName && formik.touched.displayName
                  }
                  errorMessage={formik.errors.displayName}
                  disabled={viewOnly}
                />
              </Col>
              <Col sm={10}>
                <GluuInputRow
                  label='fields.description'
                  name='description'
                  value={formik.values.description || ''}
                  formik={formik}
                  lsize={4}
                  rsize={8}
                  showError={
                    formik.errors.description && formik.touched.description
                  }
                  errorMessage={formik.errors.description}
                  disabled={viewOnly}
                />
              </Col>
              <Col sm={10}>
                <GluuInputRow
                  label='fields.realm'
                  name='realm'
                  value={formik.values.realm || ''}
                  formik={formik}
                  lsize={4}
                  rsize={8}
                  required
                  showError={formik.errors.realm && formik.touched.realm}
                  errorMessage={formik.errors.realm}
                  disabled={viewOnly}
                />
              </Col>
              <Col sm={10}>
                <GluuToggleRow label={'fields.enabled'} name='enabled' viewOnly={viewOnly} formik={formik} />
              </Col>
              <Col sm={10}>
                <FormGroup row>
                  <GluuLabel
                    label={'fields.import_metadata_from_file'}
                    size={4}
                  />
                  <Col sm={8}>
                    <Box display='flex' flexWrap='wrap' gap={1} alignItems='center'>
                      <Toggle
                        onChange={(event) => {
                          if (event.target.checked) {
                            setShowUploadBtn(true)
                          } else {
                            setMetadaDataFile(null)
                            formik.setFieldValue('importMetadataFile', false)
                            setShowUploadBtn(false)
                          }
                        }}
                        checked={showUploadBtn}
                        disabled={viewOnly}
                      />
                      {showUploadBtn && (
                        <Button
                          disabled={viewOnly}
                          color={`primary-${selectedTheme}`}
                          style={{
                            ...applicationStyle.buttonStyle,
                            ...applicationStyle.buttonFlexIconStyles,
                          }}
                          onClick={onHandleFileSelection}
                        >
                          {t('fields.import_file')}
                        </Button>
                      )}
                      {metaDataFile ? (
                        <>
                          <span className='d-inline'>{metaDataFile?.name}</span>
                          <p className='mb-0'>
                            ({((metaDataFile?.size || 0) / 1000).toFixed(0)}K)
                          </p>
                        </>
                      ) : null}
                    </Box>
                    {fileError && (
                      <div style={{ color: 'red' }}>
                        {t('messages.import_metadata_file')}
                      </div>
                    )}
                  </Col>
                </FormGroup>
              </Col>
              {showUploadBtn && (
                <input
                  type='file'
                  accept='text/xml,application/json'
                  onChange={handleFileChange}
                  id='metdaDateFile'
                  ref={inputFile}
                  style={{ display: 'none' }}
                />
              )}
              {!showUploadBtn && (
                <>
                  <Col sm={10}>
                    <GluuInputRow
                      label='fields.idp_entity_id'
                      name='idpEntityId'
                      value={formik.values.idpEntityId || ''}
                      formik={formik}
                      required
                      lsize={4}
                      rsize={8}
                      showError={
                        formik.errors.idpEntityId && formik.touched.idpEntityId
                      }
                      errorMessage={formik.errors.idpEntityId}
                      disabled={viewOnly}
                    />
                  </Col>
                  <Col sm={10}>
                    <GluuInputRow
                      label='fields.signing_certificate'
                      name='signingCertificate'
                      value={formik.values.signingCertificate || ''}
                      formik={formik}
                      lsize={4}
                      rsize={8}
                      showError={
                        formik.errors.signingCertificate &&
                        formik.touched.signingCertificate
                      }
                      errorMessage={formik.errors.signingCertificate}
                      disabled={viewOnly}
                    />
                  </Col>
                  <Col sm={10}>
                    <GluuInputRow
                      label='fields.name_policy_format'
                      name='nameIDPolicyFormat'
                      value={formik.values.nameIDPolicyFormat || ''}
                      formik={formik}
                      lsize={4}
                      rsize={8}
                      required
                      showError={
                        formik.errors.nameIDPolicyFormat &&
                        formik.touched.nameIDPolicyFormat
                      }
                      errorMessage={formik.errors.nameIDPolicyFormat}
                      disabled={viewOnly}
                    />
                  </Col>
                  <Col sm={10}>
                    <GluuInputRow
                      label='fields.single_signon_service_url'
                      name='singleSignOnServiceUrl'
                      value={formik.values.singleSignOnServiceUrl}
                      required
                      formik={formik}
                      lsize={4}
                      rsize={8}
                      showError={
                        formik.errors.singleSignOnServiceUrl &&
                        formik.touched.singleSignOnServiceUrl
                      }
                      errorMessage={formik.errors.singleSignOnServiceUrl}
                      disabled={viewOnly}
                    />
                  </Col>
                  <Col sm={10}>
                    <GluuInputRow
                      label='fields.encryption_public_key'
                      name='encryptionPublicKey'
                      value={formik.values.encryptionPublicKey || ''}
                      formik={formik}
                      lsize={4}
                      rsize={8}
                      showError={
                        formik.errors.encryptionPublicKey &&
                        formik.touched.encryptionPublicKey
                      }
                      errorMessage={formik.errors.encryptionPublicKey}
                      disabled={viewOnly}
                    />
                  </Col>
                  <Col sm={10}>
                    <GluuInputRow
                      label='fields.single_logout_service_url'
                      name='singleLogoutServiceUrl'
                      value={formik.values.singleLogoutServiceUrl || ''}
                      formik={formik}
                      lsize={4}
                      rsize={8}
                      showError={
                        formik.errors.singleLogoutServiceUrl &&
                        formik.touched.singleLogoutServiceUrl
                      }
                      errorMessage={formik.errors.singleLogoutServiceUrl}
                      disabled={viewOnly}
                    />
                  </Col>
                </>
              )}
            </FormGroup>
            {!viewOnly && (
              <Row>
                <Col>
                  <GluuCommitFooter
                    saveHandler={toggle}
                    hideButtons={{ save: true, back: false }}
                    type='submit'
                  />
                </Col>
              </Row>
            )}
            <GluuCommitDialog
              handler={toggle}
              modal={modal}
              onAccept={submitForm}
              formik={formik}
            />
          </Form>
        </CardBody>
      </Card>
    </GluuLoader>
  )
}

export default SamlIdpForm
SamlIdpForm.propTypes = {
  configs: PropTypes.any,
  viewOnly: PropTypes.bool,
}