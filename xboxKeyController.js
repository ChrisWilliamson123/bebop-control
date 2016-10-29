var keyController = function(xboxController) {
    this.keys = [];
    this.controller = xboxController;
    this.valuedKeys = ["LT", "RT", "LS", "RS"];

    this.addKey = function(keyLabel) {
        // Checks if the key is in the list, if not then add it
        if (this.keys.indexOf(keyLabel) < 0) {
            this.keys.push(keyLabel);
        }
    };

    this.removeKey = function(keyLabel) {
        var index = this.keys.indexOf(keyLabel);
        if (index >= 0) {
            this.keys.splice(index, 1);
        }
    };

    this.getLSValues = function() {
        // Get values for the left stick
        return {x:(this.controller.leftx / 32768) * 100, y:(this.controller.lefty / 32768) * 100}
    };

    this.getRSValues = function() {
        // Get X values for the right stick
        return {x:(this.controller.rightx / 32768) * 100}
    };

    this.needValue = function(key) {
        if (this.valuedKeys.indexOf(key) >= 0) {
            return true;
        }
        return false;
    }
};

module.exports = keyController;
