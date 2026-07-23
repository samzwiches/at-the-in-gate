"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createShopItem, updateShopItem } from "@/app/shop/actions";
import FormFeedback from "@/components/ui/FormFeedback";
import { initialFormActionState } from "@/lib/form-state";
import { shopCategories } from "@/lib/taxonomy";

type ShopItemValues = {
  id: string;
  title: string;
  description: string;
  category: string;
  image_path: string | null;
  destination_url: string;
  price_label: string | null;
  seller_name: string;
  is_affiliate: boolean;
};

const inputClassName = "mt-2 w-full border border-[#242721]/25 bg-[#f9f5ed] px-3.5 py-3 text-sm text-[#242721] outline-none transition-colors placeholder:text-[#777a70] focus:border-[#2d4737]";
const labelClassName = "text-sm font-semibold text-[#2d4737]";

export default function ShopItemForm({ item }: { item?: ShopItemValues }) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const action = item ? updateShopItem : createShopItem;
  const [state, formAction, pending] = useActionState(action, initialFormActionState);

  useEffect(() => {
    if (state.status === "success") {
      if (!item) formRef.current?.reset();
      router.refresh();
    }
  }, [item, router, state.status]);

  return (
    <form ref={formRef} action={formAction} className="mt-8 border border-[#242721]/20 bg-[#e7e1d5] p-5 sm:p-7">
      {item ? <input type="hidden" name="itemId" value={item.id} /> : null}
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClassName}>Item title<input name="title" required maxLength={180} defaultValue={item?.title} className={inputClassName} /></label>
        <label className={labelClassName}>Category<select name="category" required defaultValue={item?.category ?? ""} className={inputClassName}><option value="" disabled>Choose one</option>{shopCategories.map((category) => <option key={category.slug} value={category.slug}>{category.label}</option>)}</select></label>
        <label className={labelClassName}>Seller name<input name="sellerName" required maxLength={180} defaultValue={item?.seller_name} className={inputClassName} /></label>
        <label className={labelClassName}>Price label <span className="font-normal text-[#686a61]">(optional)</span><input name="priceLabel" maxLength={120} defaultValue={item?.price_label ?? ""} placeholder="$48 or see seller" className={inputClassName} /></label>
      </div>
      <label className={`mt-5 block ${labelClassName}`}>Description<textarea name="description" required maxLength={10000} rows={8} defaultValue={item?.description} className={inputClassName} /></label>
      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className={labelClassName}>External seller URL<input name="destinationUrl" type="url" required maxLength={2000} defaultValue={item?.destination_url} placeholder="https://" className={inputClassName} /></label>
        <label className={labelClassName}>Image path <span className="font-normal text-[#686a61]">(optional)</span><input name="imagePath" maxLength={500} defaultValue={item?.image_path ?? ""} placeholder="/images/shop/your-image.jpg" className={inputClassName} /></label>
      </div>
      <label className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#2d4737]"><input type="checkbox" name="isAffiliate" defaultChecked={item?.is_affiliate} /> This destination is an affiliate link</label>
      <p className="mt-3 text-sm leading-6 text-[#56584f]">Purchases happen with the external seller. At The In Gate does not process this transaction.</p>
      <div className="mt-6 flex flex-wrap gap-3 border-t border-[#242721]/15 pt-5"><button type="submit" name="intent" value="draft" disabled={pending} className="border border-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#2d4737] transition-colors hover:border-[#7b2430] hover:text-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">Save draft</button><button type="submit" name="intent" value="submit" disabled={pending} className="border border-[#2d4737] bg-[#2d4737] px-4 py-2.5 text-sm font-bold text-[#f9f4eb] transition-colors hover:bg-[#7b2430] disabled:cursor-not-allowed disabled:opacity-70">{pending ? "Saving…" : item ? "Send changes for review" : "Send for review"}</button></div>
      <FormFeedback state={state} />
    </form>
  );
}
