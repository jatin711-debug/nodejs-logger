
export class LogTemplate {
    constructor(dataType,message=null,error=null) {
        this.dataType = dataType;
        this.message = message;
        this.error = error;
    }
    //{level: 'info', message: 'Hello Welsh!!'}
    serializeData() {
        return {level:this.dataType, message:this.message, error:this.error}
    }
}
