import { useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { CASH_SHOP_BANNERS } from "./cashShopArt";
import "./cash-shop.css";

type Props = {
  onOpenCards: () => void;
};

export function CashShopBannerCarousel({ onOpenCards }: Props) {
  const [viewportRef, carousel] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [playing, setPlaying] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(true);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!carousel) return;
    const select = () => setSelectedIndex(carousel.selectedScrollSnap());
    const startDrag = () => setDragging(true);
    const endDrag = () => setDragging(false);
    select();
    carousel.on("select", select).on("reInit", select);
    carousel.on("pointerDown", startDrag).on("pointerUp", endDrag);
    return () => {
      carousel.off("select", select).off("reInit", select);
      carousel.off("pointerDown", startDrag).off("pointerUp", endDrag);
    };
  }, [carousel]);

  useEffect(() => {
    if (!carousel || reducedMotion || hovered || focused || dragging || !playing) return;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") carousel.scrollNext();
    }, 5500);
    return () => window.clearInterval(timer);
  }, [carousel, reducedMotion, hovered, focused, dragging, playing, selectedIndex]);

  return (
    <section
      className="cash-shop-banners"
      aria-label="Destaques da Loja Cash"
      aria-roledescription="carrossel"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocused(false);
      }}
    >
      <div className="cash-shop-banners__heading">
        <span>✦ DESTAQUES DA LOJA</span>
        <button type="button" onClick={onOpenCards}>Ver cards →</button>
      </div>
      <div className="cash-shop-banners__viewport" ref={viewportRef}>
        <div className="cash-shop-banners__track">
          {CASH_SHOP_BANNERS.map((banner, index) => (
            <div
              className="cash-shop-banners__slide"
              role="group"
              aria-roledescription="slide"
              aria-label={`${index + 1} de ${CASH_SHOP_BANNERS.length}`}
              aria-hidden={index !== selectedIndex}
              key={banner.id}
            >
              <button
                type="button"
                className="cash-shop-banners__art"
                onClick={onOpenCards}
                tabIndex={index === selectedIndex ? 0 : -1}
                aria-label={`${banner.alt}. Ver cards dos pacotes`}
              >
                <img src={banner.image} alt={banner.alt} loading={index === 0 ? "eager" : "lazy"} decoding="async" draggable={false} />
              </button>
            </div>
          ))}
        </div>
      </div>
      <div className="cash-shop-banners__controls">
        <button type="button" className="cash-shop-banners__arrow" aria-label="Banner anterior" onClick={() => carousel?.scrollPrev()}>‹</button>
        <div className="cash-shop-banners__dots" aria-label="Escolher banner">
          {CASH_SHOP_BANNERS.map((banner, index) => (
            <button
              type="button"
              className="cash-shop-banners__dot"
              aria-label={`Mostrar banner ${index + 1}`}
              aria-pressed={index === selectedIndex}
              key={banner.id}
              onClick={() => carousel?.scrollTo(index)}
            />
          ))}
        </div>
        <button type="button" className="cash-shop-banners__arrow" aria-label="Próximo banner" onClick={() => carousel?.scrollNext()}>›</button>
        {!reducedMotion && <button
          type="button"
          className="cash-shop-banners__pause"
          aria-label={playing ? "Pausar banners" : "Reproduzir banners"}
          aria-pressed={!playing}
          onClick={() => setPlaying((current) => !current)}
        >{playing ? "Ⅱ" : "▶"}</button>}
      </div>
    </section>
  );
}
