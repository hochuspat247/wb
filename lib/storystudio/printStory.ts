/** Запуск печати/PDF с корректной разметкой бланка. */
export function printStorySheet() {
  document.body.classList.add("story-print-active");

  const cleanup = () => {
    document.body.classList.remove("story-print-active");
    window.removeEventListener("afterprint", cleanup);
  };

  window.addEventListener("afterprint", cleanup);
  window.print();
}
