import React from 'react'
import { connect } from 'react-redux'
import { useHistory } from 'react-router-dom'
import { Container, CardBody, Card } from '../../../../app/components'
import ScopeForm from './ScopeForm'
import BlockUi from 'react-block-ui'
import { editScope } from '../../redux/actions/ScopeActions'

function ScopeEditPage({ scope, loading, dispatch, scripts, attributes }) {
  if (!scope.attributes) {
    scope.attributes = {
      spontaneousClientId: null,
      spontaneousClientScopes: [],
      showInConfigurationEndpoint: false,
    }
  }
  const history = useHistory()
  function handleSubmit(data) {
    if (data) {
      const postBody = {}
      postBody['scope'] = JSON.parse(data)
      dispatch(editScope(postBody))
      history.push('/auth-server/scopes')
    }
  }
  return (
    <React.Fragment>
      <Container>
        <BlockUi
          tag="div"
          blocking={loading}
          keepInView={true}
          renderChildren={true}
          message={'Performing the request, please wait!'}
        >
          <Card className="mb-3">
            <CardBody>
              <ScopeForm
                scope={scope}
                attributes={attributes}
                scripts={scripts}
                handleSubmit={handleSubmit}
              />
            </CardBody>
          </Card>
        </BlockUi>
      </Container>
    </React.Fragment>
  )
}
const mapStateToProps = (state) => {
  return {
    scope: state.scopeReducer.item,
    loading: state.scopeReducer.loading,
    permissions: state.authReducer.permissions,
    scripts: state.customScriptReducer.items,
    attributes: state.attributeReducer.items,
  }
}

export default connect(mapStateToProps)(ScopeEditPage)
