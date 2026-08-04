import { createListQuery } from "../utils/createListQuery"
import { loadGqlObjects } from "../utils/loadObjects"
import './me'

const NAME_FILTER_MODELS = new Set(['Spot', 'User', 'Location', 'Board'])

function registerAllQueries() {
  loadGqlObjects(ref => {
    if (!ref?.modelName) return

    const name = ref.modelName as string
    const prismaKey = (name.charAt(0).toLowerCase() + name.slice(1)) as any
    const filterFields = NAME_FILTER_MODELS.has(ref.name)
      ? (t: any) => ({
          name: t.arg.string(),
        })
      : undefined

    createListQuery(prismaKey, ref, filterFields ? { filterFields } : undefined)
  });
}

registerAllQueries();
