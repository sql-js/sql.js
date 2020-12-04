/* global document */
(function() {
    var targets = document.querySelectorAll('pre');

    setTimeout(function() {
        targets.forEach(function(item) {
            var innerHTML = item.innerHTML;
            var divElement = document.createElement('div');

            divElement.innerHTML = innerHTML;
            // item.removeChild();
            item.innerHTML = '';
            item.appendChild(divElement);
        });
    }, 300);
})();
