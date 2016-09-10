$('input[name="number-input"]').number(true, 3);
$('input[name="quantity"]').number(true, 3);

$('#btn-create-page').on('click', function(e) {
    window.location = "#create-page";
});