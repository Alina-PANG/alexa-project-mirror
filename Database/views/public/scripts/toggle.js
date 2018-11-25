/**
* @author Hangzhi Pang
*/
$(document).ready(() => {
	$('.urls_content').on('click', '.delete_audio_btn', function (){
		var $this = $(this);
		var mtg_id = $this.attr('mtg-id');
		$.ajax({
			url: $this.attr('mtg-id') + '/files/delete/' + $this.attr('audio-id'),
			type: 'POST',
			dataType: 'json',
			success: (data) => {
				//copy
				var rows = data.rows;
				var content="";
				for (let i=0;i<rows.length;i++){
					content += `
						<div class="url_item_outer">
						<div class="url_item">
						<div class='audio_urls'>
							<span class="url_label">Clip `+(i+1).toString()+`</span>
							<a class="url_content" href="`+rows[i]["audio_url"]+`">`+rows[i]["audio_url"]+`</a>
						</div>
						<div class='text_urls'>
							<span class="url_label">Notes `+(i+1).toString()+`</span>
							<a class="url_content" href="`+rows[i]["text_url"]+`">`+rows[i]["text_url"]+`</a>
							</div>
						</div>
						<div class="url_delete">
								<button class="delete_audio_btn" audio-id="`+rows[i]["id"]+`" mtg-id="`+mtg_id+`"><span class="glyphicon glyphicon-trash"></span></button>
						</div>
					</div>`;
				}//copy
				$('#'+mtg_id).html(content);
			}
		});
	});

	$('.meeting_info_btn').click(function(){
		var $this = $(this);
		var mtg_id = $this.attr('aria-controls');

		if($('#'+mtg_id).css('display') == 'none'){
			$('#'+mtg_id).show();
			$this.find("span:nth-child(1)").addClass('glyphicon-minus').removeClass('glyphicon-plus');
		} else{
			$('#'+mtg_id).hide();
			$this.find("span:nth-child(1)").addClass('glyphicon-plus').removeClass('glyphicon-minus');
		}
			$.ajax({
				url: mtg_id + '/files/',
				type: 'GET',
				dataType: 'json',
				success: (data) => {
					var rows = data.rows;
					var content = "";
					if(rows.length == 0){
						console.log('row = 0')
						content += `
							<div class="alert-outer">
								<div class="alert alert-warning" role="alert">There is currently no meeting data.</div>
							</div>`;
					}else{
					for (let i=0;i<rows.length;i++){
						content += `
							<div class="url_item_outer">
							<div class="url_item">
							<div class='audio_urls'>
								<span class="url_label">Clip `+(i+1).toString()+`</span>
								<a class="url_content" href="`+rows[i]["audio_url"]+`">`+rows[i]["audio_url"]+`</a>
							</div>
							<div class='text_urls'>
								<span class="url_label">Notes `+(i+1).toString()+`</span>
								<a class="url_content" href="`+rows[i]["text_url"]+`">`+rows[i]["text_url"]+`</a>
								</div>
							</div>
							<div class="url_delete">
									<button class="delete_audio_btn" audio-id="`+rows[i]["id"]+`" mtg-id="`+mtg_id+`"><span class="glyphicon glyphicon-trash"></span></button>
							</div>
						</div>`;
					}}

					$('#'+mtg_id).html(content);

			}});
	});
});
