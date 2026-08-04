import { GRAPHQL_ENDPOINT } from './client'

type GraphqlDocument = string | { toString(): string }

export function fetcher<TData, TVariables>(
  query: GraphqlDocument,
  variables?: TVariables,
) {
  return async (): Promise<TData> => {
    const res = await fetch(GRAPHQL_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: String(query),
        variables,
      }),
    })

    const json = await res.json()

    if (json.errors) {
      const { message } = json.errors[0]
      throw new Error(message)
    }

    return json.data
  }
}
