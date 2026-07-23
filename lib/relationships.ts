export const listingRelationshipTypes = ["seller", "trainer", "barn", "shipper", "service_provider"] as const;

export type ListingRelationshipType = (typeof listingRelationshipTypes)[number];

export type RelationshipPickerOption = {
  id: string;
  name: string;
  category?: string;
};

export type ListingRelationshipSelection = {
  sellerDirectoryEntryId: string | null;
  trainerDirectoryEntryId: string | null;
  barnDirectoryEntryId: string | null;
  shipperDirectoryEntryId: string | null;
  serviceProviderDirectoryEntryId: string | null;
  eventId: string | null;
};

export const emptyListingRelationshipSelection: ListingRelationshipSelection = {
  sellerDirectoryEntryId: null,
  trainerDirectoryEntryId: null,
  barnDirectoryEntryId: null,
  shipperDirectoryEntryId: null,
  serviceProviderDirectoryEntryId: null,
  eventId: null,
};

export function listingRelationshipLabel(type: ListingRelationshipType) {
  return {
    seller: "Seller or business",
    trainer: "Trainer",
    barn: "Barn",
    shipper: "Shipper",
    service_provider: "Service provider",
  }[type];
}

export function reviewTargetLabel(type: string) {
  return {
    directory_entry: "Directory listing",
    listing: "Marketplace listing",
    service_offering: "Service",
    shipping_route: "Shipping route",
    event: "Event",
  }[type] ?? "Record";
}
