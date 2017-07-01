require 'rails_helper'

RSpec.describe "calendar_events/edit", type: :view do
  before(:each) do
    @calendar_event = assign(:calendar_event, CalendarEvent.create!(
      :booked_by => ""
    ))
  end

  it "renders the edit calendar_event form" do
    render

    assert_select "form[action=?][method=?]", calendar_event_path(@calendar_event), "post" do

      assert_select "input#calendar_event_booked_by[name=?]", "calendar_event[booked_by]"
    end
  end
end
