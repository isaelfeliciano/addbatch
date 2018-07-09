var header = new Vue({
	el:'#header',
	data: {

	},
	methods: {
		openControlSheet: function() {
			window.open('./control-sheet.html');
			hideHeaderMenu();
		}
	}
})
var stats = new Vue({
	el: '#main-page__statistics',
	data: {
		addedBatches: '',
		batchesTotal: '',
		modifiedBatches: '',
		modifiedBatchesTimes: '',
		addedTickets: '',
		modifiedTickets: '',
		modifiedTicketsTimes: '',
		lastBatchAdded: 0
	},
	watch: {
		batchesTotal: function() {
			return this.batchesTotal = numeral(stats.batchesTotal).format('0,0.000')
		}
	}
})

var createPage = new Vue({
	el: '#create-page',
	data: {
		batchNumber: 0,
		beginingTicket: 0,
		endingTicket: 0,
		arrivalTime: moment().format('hh:mm A'),
		arrivalDate: moment().format('MM-DD-YYYY'),
		addedBy: '',
		batchType: '',
		total: '',
		tickets: []
	}
});


var batchTypeTime = new Vue({
	el: '#batch-type-time',
	data: {
		batchType: '',
		arrivalTime: moment().format('HH:mm'),
		arrivalDate: moment().format('YYYY-MM-DD'),
		showModal: false,
		modifyingBatch: false,
	},
	methods: {
		selectingBatchType: function(e, batchType){
			this.batchType = batchType;
			$('#batch-type-time .btn-batch-type').addClass('btn--no-selected');
			$(e.target).removeClass('btn--no-selected');
			createPage.batchType = batchType;
		},
		setBatchTypeTimeDate: function(){
			if (createPage.batchType === '') {
				return flashMessage("You have to select a Batch Type");
			}
			createPage.arrivalTime = moment(this.arrivalTime, 'HH:mm a').format();
			createPage.arrivalDate = moment(this.arrivalDate, 'YYYY-MM-DD').format('MM-DD-YYYY');
			// console.log(createPage.arrivalTime + ' ' + createPage.arrivalDate);
			this.showModal = false;
			if (!localStorage.getItem('printerName')) {
				vmModalSelectPrinter.getPrinters();
				vmModalSelectPrinter.showModal = true;
			}
		}
	},
	watch: {
		arrivalTime: function(){
			createPage.arrivalTime = moment(this.arrivalTime, 'HH:mm a').format();
		},
		arrivalDate: function(){
			createPage.arrivalDate = moment(this.arrivalDate, 'YYYY-MM-DD').format('MM-DD-YYYY');
		},
		showModal: function() {
			if (this.showModal && this.modifyingBatch === false) {
				this.arrivalTime = moment().format('HH:mm');
				this.arrivalDate = moment().format('YYYY-MM-DD');
			}
		}
	}
});


var vmModalSelectPrinter = new Vue({
	el: '.modal-select-printer',
	data: {
		printerList: [],
		showModal: false,
	},
	methods: {
		printerSelected: function(printerName) {
			localStorage.setItem('printerName', printerName);
			this.showModal = false;
		},
		getPrinters: function() {
			let self = this
			win.getPrinters((list) => {
				self.printerList = list; 
			});
		}
	}
})

var newInput = new Vue({
	el: '#search-ticket-input',
	data: {
		searchTicketInput: null
	},
	methods: {
		searchTicket() {
			let beginingNumber = getBeginingNumber(this.searchTicketInput);
			this.$http.get(addbatchServerURL+'getBatchNumberByBeginingNumber', { params:{batchid: beginingNumber} })
			.then(response => {
				flashMessage('Batch Number: ' + response.body.batchNumber);
			})
		},
		markProcessed() {
			let beginingNumber = getBeginingNumber(this.searchTicketInput);
			this.$http.get(addbatchServerURL+'markProcessed', { params:{batchid: beginingNumber} })
			.then(response => {
				flashMessage('Batch Processed');
			})
		}
	}
})
// $('.timepicker').wickedpicker();