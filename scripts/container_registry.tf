resource "azurerm_container_registry" "jsondevs-imgs" {
    name = var.app_name
    location = var.location
    sku = "Basic"
    resource_group_name = azurerm_resource_group.jsondevs-rg.name
    admin_enabled = true
}

output "registry_hostname" {
    value = azurerm_container_registry.jsondevs-imgs.login_server
}

output "resgistry_un" {
    value = azurerm_container_registry.jsondevs-imgs.admin_username
}

output "registry_password" {
    value = azurerm_container_registry.jsondevs-imgs.admin_password
    sensitive = true
}