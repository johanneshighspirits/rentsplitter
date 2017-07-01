require 'rails_helper'

RSpec.describe "calendar_events/index", type: :view do
  before(:each) do
    assign(:calendar_events, [
      CalendarEvent.create!(
        :booked_by => ""
      ),
      CalendarEvent.create!(
        :booked_by => ""
      )
    ])
  end

  it "renders a list of calendar_events" do
    render
    assert_select "tr>td", :text => "".to_s, :count => 2
  end
end
