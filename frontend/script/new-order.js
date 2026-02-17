/**
 * New Order page – runs only when data-page="new-order" is set on .workspace by the loader.
 * Full logic lives in new-order.html inline script (scoped to container) for now.
 * This file can be expanded to hold all new-order logic and the HTML would then use: <script src="script/new-order.js"></script>
 */
(function () {
  var container = document.querySelector('.workspace');
  if (!container || container.getAttribute('data-page') !== 'new-order') return;
  // Page logic is in new-order.html inline script; container scoping and __currentPageCleanup are applied there.
})();
