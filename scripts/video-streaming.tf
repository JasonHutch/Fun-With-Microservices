locals {
  service_name = "video-streaming"
  login_server = azurerm_container_registry.jsondevs-imgs.login_server
  username = azurerm_container_registry.jsondevs-imgs.admin_username
  password = azurerm_container_registry.jsondevs-imgs.admin_password
  image_tag = "${local.login_server}/${local.service_name}:$(var.app_version)"
}