class CalendarEventsController < ApplicationController
  
  include SessionsHelper
  include ProjectsHelper

  before_action :logged_in_member
  before_action :set_calendar_event, only: [:edit, :update, :destroy]

  # GET /calendar_events
  # GET /calendar_events.json
  def index
    @project = Project.find(current_project_id)
    @calendar_events = @project.calendar_events
    @members = @project.members.sort { |m| m.id == current_member.id ? -1 : 1 }
  end

  # GET /calendar_events/1
  # GET /calendar_events/1.json
  def show
    set_current_project_id params[:id]
    redirect_to calendar_events_path
  end

  # GET /calendar_events/new
  def new
    @calendar_event = CalendarEvent.new
  end

  # GET /calendar_events/1/edit
  def edit
  end

  # POST /calendar_events
  def create
    project = current_member.projects.where(id: current_project_id).first
    p params
    dayRange = params[:calendar_event][:from_date]..params[:calendar_event][:to_date]
    p dayRange
    conflicts = CalendarEvent.where("('from_date' BETWEEN ? AND ?) AND ('to_date' BETWEEN ? AND ?)", params[:calendar_event][:from_date], params[:calendar_event][:to_date], params[:calendar_event][:from_date], params[:calendar_event][:to_date]).exists?

    if conflicts
      puts "CONFLICT: Booking conflicts with another booking"
      render json: { error: "CONFLICT: Booking conflicts with another booking" }
    else
      @calendar_event = project.calendar_events.build(calendar_event_params)
      # Join calendar events that are next to each other in time.
      event_before = project.calendar_events.where(to_date: params[:calendar_event][:from_date].to_datetime.utc, member_id: current_member.id)
      event_after = project.calendar_events.where(from_date: params[:calendar_event][:to_date].to_datetime.utc, member_id: current_member.id)
      
      if event_before.count > 0 && event_after.count == 0
        # Merge with earlier event
        puts "Merge with earlier event"
        p event_before.first
        event_before.first.update(to_date: params[:calendar_event][:to_date])
        render json: {
          success: true,
          heading: "Booking confirmed",
          from_date: event_before.first.from_date,
          to_date: event_before.first.to_date,
          bookings: project.calendar_events.where(member_id: current_member.id),
        }
        return
      end
      if event_after.count > 0 && event_before.count == 0
        # Merge with following event
        puts "Merge with following event"
        event_after.first.update(from_date: params[:calendar_event][:from_date])
        render json: {
          success: true,
          heading: "Booking confirmed",
          from_date: event_after.first.from_date,
          to_date: event_after.first.to_date,
          bookings: project.calendar_events.where(member_id: current_member.id),
        }
        return
      end
      if event_before.count > 0 && event_after.count > 0
        # Merge with earlier and following event
        puts "Merge with both before and after"
        @calendar_event.from_date = event_before.first.from_date
        @calendar_event.to_date = event_after.first.to_date
        event_before.first.destroy
        event_after.first.destroy
      end
      if project.save 
        render json: {
          success: true,
          heading: "Booking confirmed",
          from_date: @calendar_event.from_date,
          to_date: @calendar_event.to_date,
          bookings: project.calendar_events.where(member_id: current_member.id),
        }
      else
        p project.errors
        p @calendar_event.errors
        render json: {
          error: {
            code: "#{@calendar_event.errors.messages}",
            message: "Booking could not be saved. Please try again later."
          }
        }
      end
    end
  end

  # PATCH/PUT /calendar_events/1
  # PATCH/PUT /calendar_events/1.json
  def update
    respond_to do |format|
      if @calendar_event.update(calendar_event_params)
        format.html { redirect_to @calendar_event, notice: 'Calendar event was successfully updated.' }
        format.json { render :show, status: :ok, location: @calendar_event }
      else
        format.html { render :edit }
        format.json { render json: @calendar_event.errors, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /calendar_events/1
  # DELETE /calendar_events/1.json
  def destroy
    @calendar_event.destroy
    render json: {
      success: true,
      message: "Booking successfully removed."
    }
  end
  
  def send_event_reminders
    unless params[:ids].nil?
      params[:ids].each do |memberId|
        member = Member.find(memberId)
        member.send_booking_email(
          booker: current_member,
          project_name: params[:project_name],
          project_id: params[:project_id],
          bookedDate: params[:bookedDate],
          bookedTime: params[:bookedTime],
          ics_string: params[:icsString]
        )
      end
      render json: {
        success: true,
        message: "Messages sent to #{params[:ids]}"
      }
    end
  end

  private
    # Use callbacks to share common setup or constraints between actions.
    def set_calendar_event
      @calendar_event = CalendarEvent.find(params[:id])
    end

    # Never trust parameters from the scary internet, only allow the white list through.
    def calendar_event_params
      params.require(:calendar_event).permit(:from_date, :to_date, :project_id, :member_id)
    end
end
