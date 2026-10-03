create trigger user_characters_set_updated_at before update on public.user_characters for each row execute function public.set_updated_at();
create trigger uniform_catalog_set_updated_at before update on public.uniform_catalog for each row execute function public.set_updated_at();
create trigger user_uniforms_set_updated_at before update on public.user_uniforms for each row execute function public.set_updated_at();
create trigger sticker_catalog_set_updated_at before update on public.sticker_catalog for each row execute function public.set_updated_at();
create trigger user_stickers_set_updated_at before update on public.user_stickers for each row execute function public.set_updated_at();
create trigger cosmetic_catalog_set_updated_at before update on public.cosmetic_catalog for each row execute function public.set_updated_at();
create trigger user_cosmetics_set_updated_at before update on public.user_cosmetics for each row execute function public.set_updated_at();