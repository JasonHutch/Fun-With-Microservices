resource "azurerm_resource_group" "jsondevs-rg" {
    name = var.app_name
    location = var.location
}
