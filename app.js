const lS = localStorage;
let ticketsValues = [];

function updateNumberFormat() {
	$('input[name="number-input"]').number(true);
	$('input[name="quantity"]').number(true, 3);
};
updateNumberFormat();

$('#btn-create-page').on('click', (e) => {
    window.location = "#create-page";
    $('.modal__box i').attr('class', 'fa fa-5x fa-book').text('');
    $('#jsModalInput').attr('name', 'batchNumber');
    $('#jsModalInput').attr('placeholder', 'Enter batch number');
    $('.modal').toggleClass('no-display');
    $('#jsModalInput').focus();
    $('.jsModal-save').on('click', (e) => {
    	let batchNumber = $('#jsModalInput').val();
    	$('#jsBatchNumber').text(batchNumber);
    	$('.modal').toggleClass('no-display');
	    $('input[name="number-input"]').focus();
    });
});

// lS.removeItem('firstTime');
if (!lS.getItem('firstTime')) {
	$('.modal').toggleClass('no-display');
	$('input[name="user"]').focus();
	$('.jsModal-save').on('click', function() {
		let userName = $('input[name="user"]').val();
		lS.setItem('firstTime', `{userName: ${userName}}`);
		$('.modal').toggleClass('no-display');
		$('input[name="user"]').val('');
		$('input[name="search"]').focus();
	});
}

$('input[name="number-input"]').on('keydown', (e) => {
	if (e.which == 13 || e.keyCode == 13) {
		e.preventDefault();
		let value = $('input[name="number-input"]').val();
		$('.quantity-list').append(
			`<li>
				<input type="text" name="quantity" value="${value}" maxlength="15"> 
				<span>(0)</span>
			</li>`
		);
		$('input[name="number-input"]').val('');
		
		var backSpace = jQuery.Event("keydown");
		backSpace.which = 8;
		$('input[name="number-input"]').trigger(backSpace);
		
		updateNumberFormat();

		$('#jsTickets').text($('.quantity-list').children().length);

		value = parseFloat(value);
		ticketsValues.push(value);
		console.log(value);
		$('#jsTotal').text(_.sum(ticketsValues));
		$('#jsTotal').number(true, 3);
		console.log(ticketsValues);
	}
});

$('#jsModalInput').on('keydown', (e) => {
	if (e.which == 13 || e.keyCode == 13) {
		e.preventDefault();
		$('.jsModal-save').trigger('click');
	}
});