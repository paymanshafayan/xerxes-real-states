import {
  getProperties,
  getPropertyBySlug,
  getPropertyById,
  getPriceDrops,
  getAgents,
  getAgentById,
  getPropertyCount,
  getCurrentDataSource,
  setDataSource,
} from "@/lib/data/dataProvider";
import { sampleProperties, sampleAgents } from "@/lib/data/sampleData";

describe("DataProvider & Fallback behavior", () => {
  test("getCurrentDataSource returns a valid data source string", async () => {
    const ds = await getCurrentDataSource();
    expect(["sample", "database"]).toContain(ds);
  });

  test("getProperties returns sample data when sample mode is active or DB is empty", async () => {
    const props = await getProperties();
    expect(props.length).toBeGreaterThan(0);
    expect(props[0]).toHaveProperty("slug");
    expect(props[0]).toHaveProperty("price");
  });

  test("getPropertyById finds property by id", async () => {
    const first = sampleProperties[0];
    const prop = await getPropertyById(first.id);
    expect(prop).not.toBeNull();
    expect(prop?.id).toBe(first.id);
  });

  test("getPropertyBySlug finds property by slug", async () => {
    const first = sampleProperties[0];
    const prop = await getPropertyBySlug(first.slug);
    expect(prop).not.toBeNull();
    expect(prop?.slug).toBe(first.slug);
  });

  test("getAgents returns agent list", async () => {
    const agents = await getAgents();
    expect(agents.length).toBeGreaterThan(0);
  });

  test("getAgentById returns agent by id", async () => {
    const first = sampleAgents[0];
    const agent = await getAgentById(first.id);
    expect(agent).not.toBeNull();
    expect(agent?.id).toBe(first.id);
  });

  test("getPropertyCount returns positive count", async () => {
    const count = await getPropertyCount();
    expect(count).toBeGreaterThan(0);
  });

  test("getPriceDrops returns list of discounted properties", async () => {
    const priceDrops = await getPriceDrops(5);
    expect(Array.isArray(priceDrops)).toBe(true);
  });
});
