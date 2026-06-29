document.querySelectorAll('.sector-card').forEach(card => {
    card.addEventListener('click', function() {
        const sector = this.getAttribute('data-sector');
        const searchBar = document.querySelector('#search-input'); // Adjust selector to your search bar ID
        if(searchBar) {
            searchBar.value = `auditops "Mesa Premier Legal - Factor: Municipal Residency" --logic=strategist`;
            searchBar.focus();
        }
    });
});
