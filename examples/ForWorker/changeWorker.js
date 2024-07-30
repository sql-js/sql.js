if(self.Worker){
    Object.assign(Worker.prototype,{
        methods:new Map(),
        feedback:new Map(),
        isFeedback(method){
            return this.feedback&&this.feedback.has(method);
        },
        callFeedback(method,...arg){
            if(this.isFeedback(method)){
                return this.feedback.get(method).apply(this,arg);
            }
        },
        isMethod(method){
            return this.methods&&this.methods.has(method);
        },
        callMethod(method,...arg){
            if(this.isMethod(method)){
                return this.methods.get(method).apply(this,arg);
            }
        },
        uuid(){
            return crypto?crypto.randomUUID():btoa(performance.now()+Math.random());
        },
        addFeedback(id,back,error){
            this.feedback.set(id,function(data){
                if(data.error&&error instanceof Function)return error(data.error);
                if(back instanceof Function) return back(data.result);
            });
        },
        async getFeedback(result,transf){
            return new Promise((back,error)=>{
                const id = this.uuid();
                this.addFeedback(id,back,error);
                result.id = id;
                this.postMessage(result,transf);
            });
        },
        async postMethod(method,result,transf){
            return this.getFeedback({method,result},transf);
        },
        async publicMethod(){
            const methods = await this.postMethod('publicMethod');
            methods&&methods.forEach(v=>{
                if(v=='constructor')return;
                this.methods.set(v,new Function('...result','return this.postMethod("'+v+'",result)'))
            });
        },
        async addMessage(message,transf){
            this.addEventListener('message',async function(event){
                const data = event.data;
                const port = event.source || event.target;
                if (data && data.constructor === Object) {
                    if(this.isMethod(data.method)){
                        return this.callMethod(data.method,data,port);
                    }
                    const id = data.workerId||data.id;
                    if(this.isFeedback(id)){
                        return this.callFeedback(id,data,port);
                    }
                }
                if (this.callMessage instanceof Function) return this.callMessage(data, port);
            });
            if(message)this.postMessage(message,transf);
        },
        setMessage(fn,message,transf){
            if(fn instanceof Function) this.callMessage = fn;
            this.addMessage(message,transf);
        },
        initMessage(){
            return new Promise((resolve,reject)=>{
                const error = e=>reject(e.message);
                this.addEventListener('message',async function(event){
                    const data = event.data;
                    if(data === 'complete'){
                        this.removeEventListener('error',error);
                        this.addMessage();
                        resolve(this);
                    }
                },{once:true});
                this.addEventListener('error',error,{once:true});

            });
        }
    });
}