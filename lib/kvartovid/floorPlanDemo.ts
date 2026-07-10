import { getFallbackFloorPlanLayout } from "@/lib/kvartovid/floorPlanRender";
import type { KvartovidListingInput } from "@/types/kvartovid";

const DEMO_LISTING_INPUT: KvartovidListingInput = {
  dealType: "sale",
  propertyType: "apartment",
  rooms: "2",
  area: 23,
  city: "Москва",
  photos: []
};

export const KVARTOVID_FLOOR_PLAN_DEMO = getFallbackFloorPlanLayout(DEMO_LISTING_INPUT);
