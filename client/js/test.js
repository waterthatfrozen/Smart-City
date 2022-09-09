let floatingSelect = $('#floatingSelect');

setInterval(() => {
    $('#title').text(new Date().toLocaleString());
}, 1000);

floatingSelect.on('change', function() {
    console.log(floatingSelect.val());
});