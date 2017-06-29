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