import AddDailyOmset from "../custom-component/card/AddDailyOmset";
import AddRealOmset from "../custom-component/card/AddRealOmset";
import Adverticer from "../pages/Adverticer";

export default function page() {
    return (
        <div>
            <Adverticer />
            <AddRealOmset />
            <AddDailyOmset />
        </div >
    )
}