/**
 * Ready Order page – runs only when data-page="ready-extra-order" is set on .workspace by the loader.
 * Full logic lives in ready-extra-order.html inline script (scoped to container) for now.
 * This file can be expanded to hold all ready-order logic and the HTML would then use: <script src="script/ready-order.js"></script>
 */
(function () {
  var container = document.querySelector('.workspace');
  if (!container || container.getAttribute('data-page') !== 'ready-extra-order') return;
  // Page logic is in ready-extra-order.html inline script; container scoping and __currentPageCleanup are applied there.
})();
