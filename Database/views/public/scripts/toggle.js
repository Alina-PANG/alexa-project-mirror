$(document).ready(() => {
	$('button').click(function(){
		var $this = $(this);
		var mtg_id = $this.attr('aria-controls')
		if($('#'+mtg_id).html().length > 5){
			if($('#'+mtg_id).css('display') == 'none'){
				$('#'+mtg_id).show();
			} else{
				$('#'+mtg_id).hide();
			}
		}else{
			$.ajax({
				url: mtg_id + '/files/',
				type: 'GET',
				dataType: 'json',
				success: (data) => {
					var rows = data.rows;
					console.log($('#'+mtg_id))
					var content = "<br>"
					for (let i=0;i<rows.length;i++){
						content += "<p><div class='audio_urls'>Audio: "+rows[i]["audio_url"]+"</div><div class='text_urls'>Text: "+rows[i]["text_url"]+"</div></p>";
					}
					$('#'+mtg_id).html(content);
				}
			});
		}
	});
});