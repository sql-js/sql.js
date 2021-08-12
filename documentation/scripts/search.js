/* global document */
function hideSearchList() {
    document.getElementById('search-item-ul').style.display = 'none';
}

function showSearchList() {
    document.getElementById('search-item-ul').style.display = 'block';
}

function checkClick(e) {
    if ( e.target.id !== 'search-box-input') {
        setTimeout(function() {
            hideSearchList();
        }, 60);

        /* eslint-disable-next-line */
        window.removeEventListener('click', checkClick);
    }
}

function search(list, options, keys, searchKey) {
    var defaultOptions = {
        shouldSort: true,
        threshold: 0.4,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 1,
        keys: keys
    };

    var op = Object.assign({}, defaultOptions, options);

    // eslint-disable-next-line no-undef
    var searchIndex = Fuse.createIndex(op.keys, list);

    /* eslint-disable-next-line */
    var fuse = new Fuse(list, op, searchIndex);

    var result = fuse.search(searchKey);

    console.log(result, result.length);
    if (result.length > 20) { result = result.slice(0, 20); }

    console.log(result);
    var searchUL = document.getElementById('search-item-ul');

    searchUL.innerHTML = '';

    if (result.length === 0) {
        searchUL.innerHTML += '<li class="p-h-n"> No Result Found </li>';
    } else {
        result.forEach(function(obj) {
            searchUL.innerHTML += '<li>' + obj.item.link + '</li>';
        });
    }
}

/* eslint-disable-next-line */
function setupSearch(list, options) {
    var inputBox = document.getElementById('search-box-input');
    var keys = ['title'];

    inputBox.addEventListener('keyup', function() {
        if (inputBox.value !== '') {
            showSearchList();
            search(list, options, keys, inputBox.value);
        }
        else { hideSearchList(); }
    });

    inputBox.addEventListener('focus', function() {
        showSearchList();
        if (inputBox.value !== '') {
            search(list, options, keys, inputBox.value);
        }

        /* eslint-disable-next-line */
        window.addEventListener('click', checkClick);
    });
}


