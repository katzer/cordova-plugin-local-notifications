interface LocalNotification {
    local: {
        requestPermission : (callback : function) => void
    }
}

interface CordovaPlugin {
    notification : LocalNotification
}