class AddInvoicesSentAtToProjects < ActiveRecord::Migration[5.0]
  def change
    add_column :projects, :invoices_sent_at, :datetime
  end
end
