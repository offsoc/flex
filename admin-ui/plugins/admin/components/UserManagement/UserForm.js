import React, { useState } from 'react'
import { Col, Form, FormGroup } from '../../../../app/components'
import GluuInputRow from '../../../../app/routes/Apps/Gluu/GluuInputRow'
import GluuSelectRow from '../../../../app/routes/Apps/Gluu/GluuSelectRow'
import GluuFooter from '../../../../app/routes/Apps/Gluu/GluuFooter'
import { useTranslation } from 'react-i18next'
import { initialClaims } from './constLists'
import UserClaimEntry from './UserClaimEntry'

function UserForm({ formik }) {
  const { t } = useTranslation()
  const DOC_SECTION = 'user'
  const [searchClaims, setSearchClaims] = useState('')
  const [selectedClaims, setSelectedClaims] = useState([])
  const [claims, setClaims] = useState(initialClaims)

  const setSelectedClaimsToState = (data) => {
    let tempList = [...selectedClaims]
    tempList.push(data)
    setSelectedClaims(tempList)
  }

  const removeSelectedClaimsFromState = (id) => {
    let tempList = [...selectedClaims]
    let newList = tempList.filter((drink, index) => index !== id)
    setSelectedClaims(newList)
  }

  return (
    <Form onSubmit={formik.handleSubmit}>
      <FormGroup row>
        <Col sm={8}>
          <GluuInputRow
            doc_category={DOC_SECTION}
            label="User Id"
            name="userId"
            value={formik.values.userId || ''}
            formik={formik}
            required
            lsize={3}
            rsize={9}
          />
          <GluuInputRow
            doc_category={DOC_SECTION}
            label="Given Name"
            name="givenName"
            value={formik.values.givenName || ''}
            formik={formik}
            lsize={3}
            rsize={9}
          />
          <GluuInputRow
            doc_category={DOC_SECTION}
            label="Display Name"
            name="displayName"
            value={formik.values.displayName || ''}
            formik={formik}
            lsize={3}
            rsize={9}
          />
          <GluuInputRow
            doc_category={DOC_SECTION}
            label="Email"
            name="mail"
            type="email"
            value={formik.values.mail || ''}
            formik={formik}
            lsize={3}
            rsize={9}
          />
          <GluuSelectRow
            doc_category={DOC_SECTION}
            label="Status"
            name="jansStatus"
            value={formik.values.jansStatus || ''}
            values={['active', 'inactive']}
            formik={formik}
            lsize={3}
            rsize={9}
          />
          <GluuInputRow
            doc_category={DOC_SECTION}
            label="Password"
            name="userPassword"
            type="password"
            value={formik.values.userPassword || ''}
            formik={formik}
            lsize={3}
            rsize={9}
          />
          {selectedClaims.map((data, key) => (
            <UserClaimEntry
              entry={key}
              data={data}
              formik={formik}
              handler={removeSelectedClaimsFromState}
              type={data.type}
            />
          ))}
          <GluuFooter />
        </Col>
        <Col sm={4}>
          <div className="border border-light ">
            <div className="bg-light text-bold p-2">Available Claims</div>
            <input
              type="search"
              className="form-control mb-2"
              placeholder="Search Claims Here "
              onChange={(e) => setSearchClaims(e.target.value)}
              value={searchClaims}
            />
            <ul className="list-group">
              {claims.map((data, key) => {
                let name = data.name.toLowerCase()
                const alreadyAddedClaim = selectedClaims.some(
                  (el) => el.name === data.name,
                )
                if (
                  (name.includes(searchClaims.toLowerCase()) ||
                    searchClaims == '') &&
                  !alreadyAddedClaim
                ) {
                  return (
                    <li
                      className="list-group-item"
                      key={'list' + key}
                      title="Click to add to the form"
                    >
                      <a
                        onClick={() => setSelectedClaimsToState(data)}
                        style={{ cursor: 'pointer' }}
                      >
                        {data.name}
                      </a>
                    </li>
                  )
                }
              })}
            </ul>
          </div>
        </Col>
      </FormGroup>
    </Form>
  )
}

export default UserForm
