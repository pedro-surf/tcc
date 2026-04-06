// src/graphql/plugins/loggingPlugin.ts
import { Plugin } from 'graphql-yoga'

export const loggingPlugin: Plugin<{ ip: string }> = {
    async onExecute(payload) {
        const { args, context } = payload
        const start = Date.now()
        const id = Math.random().toString(36).substring(2, 15);
        console.log(`${id} [GQL Request] IP: ${context.ip} / ${new Date(start).toISOString()}`)
        console.log(`${id} [Variables] ${JSON.stringify(args.variableValues) ?? ""}`)
        console.log(`${id} [Query] ${args.document.loc?.source.body}`)

        return {
            onExecuteDone({ result }) {
                const time = Date.now() - start
                if ('errors' in result && result.errors?.length > 0) {
                    console.log(`[GraphQL Failed] IP: ${context.ip} | ${time}ms`)
                    console.log(result.errors)
                } else {
                    console.log(`[GraphQL Success] IP: ${context.ip} | ${time}ms`)
                }
            },
        }
    },
}