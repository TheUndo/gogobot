import { getResource } from "!/bot/logic/inventory/getResource";
import { removeDuplicates } from "!/bot/utils/removeDuplicates";

type ResourcesType = {
  id: string;
  type: string;
  itemId: string;
  walletId: string;
};
/**Gets the resource data and adds them into quantities */
export async function aggregateResources(resources: ResourcesType[]) {
  const categorizedResources = removeDuplicates(
    resources.map((resource) => resource.itemId),
  );

  const data = [];

  for (const categorizedResource of categorizedResources) {
    const filter = resources.filter(
      (resource) => resource.itemId === categorizedResource,
    );
    const key = await getResource(categorizedResource);
    data.push({
      resourceId: categorizedResource,
      quantity: filter.length,
      sellPrice: key?.sellPrice ? key.sellPrice * filter.length : 0,
    });
  }

  return data;
}
