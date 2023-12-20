import { AuthenticationDetails, CognitoUser, CognitoUserPool } from 'amazon-cognito-identity-js'
import { request, gql } from 'graphql-request'

const poolData = {
  UserPoolId: 'FILL_THIS_IN',
  ClientId: 'FILL_THIS_IN',
}
const username = 'FILL_THIS_IN'
const password = 'FILL_THIS_IN'

const userPool = new CognitoUserPool(poolData)

const authenticateUser = async (username, password) => {
  const authenticationDetails = new AuthenticationDetails({
    Username: username,
    Password: password,
  })

  const userData = {
    Username: username,
    Pool: userPool,
  }

  const cognitoUser = new CognitoUser(userData)

  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: result => {
        const accessToken = result.getAccessToken().getJwtToken()
        const idToken = result.getIdToken().getJwtToken()
        resolve({ accessToken, idToken })
      },
      onFailure: err => {
        reject(err)
      },
    })
  })
}

const invokeGraphQL = async (token, graphqlEndpoint, query, variables = {}) => {
  const headers = {
    Authorization: token,
  }

  try {
    const response = await request(graphqlEndpoint, query, variables, headers)
    return response
  } catch (error) {
    console.error('Error invoking GraphQL API:', error)
    throw error
  }
}

const sampleQuery = gql`
  query ClientsAndInvitations {
    clients {
      id
      account {
        accountAttributes {
          email
          id
        }
      }
    }
    clientsInvitation {
      ... on ClientInvitation {
        id
        email
        acceptedDate
      }
    }
  }
`

;(async () => {
  const { idToken } = await authenticateUser(username, password)

  const graphqlEndpoint = 'https://coreapi.prod.getcarefull.com/graphql'

  const response = await invokeGraphQL(idToken, graphqlEndpoint, sampleQuery)
  console.log('GraphQL response:', JSON.stringify(response))
})()
