require 'rails_helper'

RSpec.describe "calendar_events/new", type: :view do
  before(:each) do
    assign(:calendar_event, CalendarEvent.new(
      :booked_by => ""
    ))
  end

  it "renders new calendar_event form" do
    render

    assert_select "form[action=?][method=?]", calendar_events_path, "post" do

      assert_select "input#calendar_event_booked_by[name=?]", "calendar_event[booked_by]"
    end
  end
end
