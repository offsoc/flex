import React from 'react'
import { connect } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { Container, CardBody, Card } from 'Components'
import LdapForm from './LdapForm'
import { editLdap } from 'Plugins/services/redux/features/ldapSlice'
import { buildPayload } from 'Utils/PermChecker'
import { isEmpty } from 'lodash'

function LdapEditPage({ item, dispatch }) {
  const userAction = {}
  const navigate =useNavigate()
  function handleSubmit(data) {
    if (!isEmpty(data)) {
      const message = data.action_message
      delete data.action_message
      buildPayload(userAction, message, data)
      dispatch(editLdap({ data: userAction }))
      navigate('/config/ldap')
    }
  }

  return (
    <React.Fragment>
      <Container>
        <Card className="mb-3">
          <CardBody>
            <LdapForm item={{ ...item }} handleSubmit={handleSubmit} />
          </CardBody>
        </Card>
      </Container>
    </React.Fragment>
  )
}
const mapStateToProps = (state) => {
  return {
    item: state.ldapReducer.item,
    loading: state.ldapReducer.loading,
    permissions: state.authReducer.permissions,
  }
}
export default connect(mapStateToProps)(LdapEditPage)
