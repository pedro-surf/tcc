import { createListQuery } from "../utils/createListQuery"
import { loadGqlObjects } from "../utils/loadObjects"

const NAME_FILTER_MODELS = new Set(['Spot', 'User', 'Location', 'Board'])

function registerAllQueries() {
  loadGqlObjects(ref => {
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
